// Copyright 2016, EMC, Inc.

"use strict";

var di = require('di'),
    _ = require('lodash'),
    core = require('on-core')(di),
    mode,
    injector = new di.Injector(
        _.flatten([
            core.injectables,
            core.helper.requireGlob(__dirname + '/lib/**/*.js')
        ])
    ),
    core = injector.get('Services.Core'),
    configuration = injector.get('Services.Configuration'),
    Logger = injector.get('Logger'),
    logger = Logger.initialize('SSDP');
    
core.start()
.then(function() {
    var Service, ssdp;
    if (_.contains(process.argv, '-c') || 
        _.contains(process.argv, '--client')) {
        Service = injector.get('SSDP.Client');
        ssdp = new Service();
    } else {
        Service = injector.get('SSDP.Server');
        ssdp = new Service();
    }
    ssdp.start();
    return ssdp;
})
.catch(function(e) {
    logger.critical('Error starting SSDP service', {error: e});
    process.nextTick(function() {
        process.exit(1);
    });
});
