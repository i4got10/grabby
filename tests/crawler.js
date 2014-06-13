/*global describe, before, after, it, afterEach, beforeEach, done */

var crawler = require('../lib/crawler'),
    fs = require('fs'),
    nock = require('nock'),
    assert = require("assert");

describe('grabby', function() {
    describe('#requestHtml', function () {
        it('can request simple html pages', function() {
            nock('http://ya.ru')
                .get('/')
                .reply(200, function(uri, requestBody) {
                    return fs.createReadStream(__dirname + '/mock/ya.ru.html');
                }, {});

            var request = {url: 'http://ya.ru/', headers: {'Accept-Encoding': ''}};

            crawler.requestHtml(request).then(function (html) {
                assert.equal(true, (/<title>Яндекс<\/title>/gi).test(html));
            }).done();
        });

        it('can request html pages encoded with gzip', function() {
            nock('http://ya.ru')
                .get('/')
                .reply(200, function(uri, requestBody) {
                    return fs.createReadStream(__dirname + '/mock/ya.ru.gzip');
                }, {'Content-Encoding': 'gzip'});

            var request = {url: 'http://ya.ru/', headers: {'Accept-Encoding': 'gzip'}};

            crawler.requestHtml(request).then(function (html) {
                assert.equal(true, (/<title>Яндекс<\/title>/gi).test(html));
            }).done();
        });
    });
});
