var crawler = require('../lib/crawler'),
    mocks = require('./mock/mocks.js'),
    fs = require('fs');

// nodeunit tests/crawler.js
module.exports.group1 = {
    'crawler can grab ya.ru': function(test) {
        mocks.enableHttpMocks();

        var request = {url: 'http://ya.ru/unzipped', headers: {'Accept-Encoding': ''}};
        crawler.grab(request).then(function (html) {
            test.done();
        }).done();
    },

    'crawler grab gzipped ya.ru': function(test) {
        mocks.enableHttpMocks();

        var request = {url: 'http://ya.ru/zipped', headers: {'Accept-Encoding': 'gzip'}};
        crawler.grab(request).then(function (html) {
            test.done();
        }).done();
    }
};
