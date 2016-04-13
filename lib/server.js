// Copyright 2016, EMC, Inc.

"use strict";

var di = require('di');

module.exports = serverFactory;
di.annotate(serverFactory, new di.Provide('SSDP.Server'));
di.annotate(serverFactory, new di.Inject(
        'Services.Core',
        'Logger',
        'Assert',
        'Services.Configuration',
        'Services.Messenger',
        'Constants',
        'Promise',
        '_'
    )
);
function serverFactory(
    core, 
    Logger, 
    assert, 
    configuration, 
    messenger,
    Constants,
    Promise,
    _
) {
    var logger = Logger.initialize(Server);

    function Server() {
        this.usnList = [];
    }
    
    Server.prototype.createServer = function() {
        var Server = require('node-ssdp').Server;
        this.server = new Server();
    };
    
    Server.prototype.subUrnAddListener = function(callback) {  
        var self = this;    
        return messenger.subscribe(
            Constants.Protocol.Exchanges.SSDP.Name,
            'ssdp.server.usn.add', 
            function(data) {
                callback(data);
            }
        ).then(function(subscription) {
            self.subscription = subscription;
            return subscription;
        })
    };

    Server.prototype.start = function() {
        var self = this;
        logger.debug('Starting SSDP Server');
        
        self.createServer();
        _.forEach(self.usnList, function(usn) {
            // TODO add USN's from the database
            self.server.addUSN(usn);
        });
        
        self.server.on('advertise-alive', function (heads) {
            // TODO Expire old devices from your cache.
            // TODO Register advertising device somewhere (as designated in http headers heads)
        })

        self.server.on('advertise-bye', function (heads) {
            // TODO Remove specified device from cache.
        })

        // start server on all interfaces
        self.server.start(configuration.get('ssdpBindAddress', '0.0.0.0'));
        self.subUrnAddListener(function(data) {
            logger.debug('Received Message', {message:data});
            if (data.usn) {
                logger.debug('Adding USN', {usn:data.usn});
                self.server.addUSN(data.usn);
            } 
        });
    };

    Server.prototype.stop = function() {
        return self.subscription.dispose();  
    };

    return Server;
}
