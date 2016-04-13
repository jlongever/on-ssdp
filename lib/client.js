// Copyright 2016, EMC, Inc.

"use strict";

var di = require('di');


module.exports = clientFactory;
di.annotate(clientFactory, new di.Provide('SSDP.Client'));
di.annotate(clientFactory, new di.Inject(
        'Services.Core',
        'Logger',
        'Assert',
        '_'
    )
);
function clientFactory(core, Logger, assert, _) {
    var logger = Logger.initialize(Client);

    function Client(searchCriteria, interval) {
        this.urn = searchCriteria || 'ssdp:all';
        this.interval = interval || 5000;
        assert.string(this.urn, 'URN Search Criteria');
        assert.number(this.interval, 'Search Interval');
    }

    Client.prototype.createClient = function() {
        var Client = require('node-ssdp').Client;
        this.client = new Client();
    };

    Client.prototype.start = function() {
        var self = this;
        logger.debug('Starting SSDP Client');

        self.createClient();
        self.client.on('notify', function () {
            logger.debug('Got a notification.')
        });

        self.client.on('response', function(headers, code, info) {
            logger.info('Got a response to an m-search:', {
                code: code, 
                headers: headers, 
                info:info
            });
        });
        setInterval(function() { 
            self.client.search(self.urn) 
        }, self.interval)
    };

    Client.prototype.stop = function() {
    };

    return Client;
}
