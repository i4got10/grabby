/*global describe, before, after, it, afterEach, beforeEach, done */

var crawler = require('../lib/crawler'),
    mocks = require('./mock/mocks.js'),
    fs = require('fs'),
    assert = require("assert");

describe('crawler', function() {
    mocks.enableHttpMocks();

    it('should grab ya.ru', function() {
        var request = {url: 'http://ya.ru/unzipped', headers: {'Accept-Encoding': ''}};

        crawler.requestHtml(request).then(function (html) {
            done();
        }).done();
    });

    it('should grab gzipped ya.ru', function() {
        var request = {url: 'http://ya.ru/zipped', headers: {'Accept-Encoding': 'gzip'}};
        crawler.requestHtml(request).then(function (html) {
            done();
        }).done();
    });
});
