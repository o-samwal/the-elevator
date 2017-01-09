/**
 * Created by Sam.
 */
'use strict';

module.exports = function (config) {
    config.set({
        basePath:      '.',
        frameworks:    ['jasmine'],
        preprocessors: {
            'app/js/**/*.js': ['coverage'],
            'test/**/*.js':   ['coverage']
        },
        browsers:      ['PhantomJS'],
        reporters:     ['progress', 'coverage'],
        colors:        true,
        autoWatch:     true,
        files:         [
            'node_modules/angular/angular.js',
            'node_modules/angular-mocks/angular-mocks.js',
            'app/js/elevator.js',
            'app/js/elevator-simple-service.js',
            'app/js/elevator-smart-service.js',
            'test/**/*-test.js'
        ],
        logLevel:      config.LOG_INFO,
        port:          9874,
        singleRun:     false
    });
};