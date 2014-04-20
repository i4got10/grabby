var crawler = require('../lib/crawler'),
    mocks = require('./mock/mocks.js'),
    fs = require('fs');

// nodeunit tests/crawler.js
module.exports.group1 = {
    'crawler grab ya.ru': function(test) {
        mocks.mock('ya.ru');

        var request = {url: 'http://ya.ru'};
        crawler.grab(request).then(function (html) {
            console.log(html);
            test.done();
        }).done();
    }
};
