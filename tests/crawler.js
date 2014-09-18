/*global describe, before, after, it, afterEach, beforeEach */

var grabby = require('../lib/crawler'),
    fs = require('fs'),
    nock = require('nock'),
    assert = require('assert'),
    vow = require('vow');

nock.disableNetConnect();

var responses = {
    'ya.ru-plain': function () {
        return fs.createReadStream(__dirname + '/mock/ya.ru.html');
    },
    'ya.ru-gzip': function () {
        return fs.createReadStream(__dirname + '/mock/ya.ru.gzip');
    }
};

describe('grabby', function() {
    describe('#requestHtml', function () {
        it('can request simple html pages', function() {
            nock('http://ya.ru')
                .get('/')
                .reply(200, responses['ya.ru-plain'], {});

            var request = {url: 'http://ya.ru/'};

            return grabby.requestHtml(request).then(function (html) {
                assert.equal(true, (/<title>Яндекс<\/title>/gi).test(html));
            });
        });

        it('can request html pages encoded with gzip', function() {
            nock('http://ya.ru')
                .get('/')
                .reply(200, responses['ya.ru-gzip'], {'Content-Encoding': 'gzip'});

            var request = {url: 'http://ya.ru/', headers: {'Accept-Encoding': 'gzip'}};

            return grabby.requestHtml(request).then(function (html) {
                assert.equal(true, (/<title>Яндекс<\/title>/gi).test(html));
            });
        });

        it('can make few attempts if meet 409', function () {
            nock('http://ya.ru')
                .get('/')
                .times(1)
                .reply(409, 'too often')

                .get('/')
                .times(1)
                .reply(200, responses['ya.ru-plain'], {})

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
                assert.equal(true, (/<title>Яндекс<\/title>/gi).test(html));
            });
        });

        it('make only 1 attempt if limit set to 1', function () {
            nock('http://ya.ru')
                .get('/')
                .times(1)
                .reply(409, 'too often')

                .get('/')
                .times(1)
                .reply(200, responses['ya.ru-plain'], {});

            var request = {
                url: 'http://ya.ru/',
                attempt: {
                    reason: 409,
                    delay: 0,
                    limit: 1
                }
            };

            return grabby.requestHtml(request).then(
                function () {
                    throw new Error();
                },
                function () {
                    return 1;
                }
            );
        });
    });
});
