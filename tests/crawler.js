/*global describe, before, after, it, afterEach, beforeEach, done */

var grabby = require('../lib/crawler'),
    fs = require('fs'),
    nock = require('nock'),
    assert = require("assert"),
    should = require('should');

describe('grabby', function() {
    describe('#requestHtml', function () {
        it('can request simple html pages', function() {
            nock('http://ya.ru')
                .get('/')
                .reply(200, function(uri, requestBody) {
                    return fs.createReadStream(__dirname + '/mock/ya.ru.html');
                }, {});

            var request = {url: 'http://ya.ru/'};

            return grabby.requestHtml(request).then(function (html) {
                assert.equal(true, (/<title>Яндекс<\/title>/gi).test(html));
            });
        });

        it('can request html pages encoded with gzip', function() {
            nock('http://ya.ru')
                .get('/')
                .reply(200, function(uri, requestBody) {
                    return fs.createReadStream(__dirname + '/mock/ya.ru.gzip');
                }, {'Content-Encoding': 'gzip'});

            var request = {url: 'http://ya.ru/', headers: {'Accept-Encoding': 'gzip'}};

            return grabby.requestHtml(request).then(function (html) {
                assert.equal(true, (/<title>Яндекс<\/title>/gi).test(html));
            });
        });

        it('can make few attempts if meet 409', function () {
            var requestScope = nock('http://ya.ru')
                .get('/')
                .times(1)
                .reply(409, 'too often')

                .get('/')
                .times(1)
                .reply(200, function(uri, requestBody) {
                    return fs.createReadStream(__dirname + '/mock/ya.ru.html');
                }, {})

                .get('/')
                .times(1)
                .reply(409, 'too often');

            var request = {
                url: 'http://ya.ru/',
                attempt: {
                    reason: 409,
                    delay: 0,
                    limit: 10
                }
            };

            return grabby.requestHtml(request).then(function (html) {
                should.equal(true, (/<title>Яндекс<\/title>/gi).test(html));
            }, function (f) {
                assert.fail(f);
            });
        });
    });
});
