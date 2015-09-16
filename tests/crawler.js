/*global describe, before, after, it, afterEach, beforeEach */

var grabby = require('../lib/crawler');
var fs = require('fs');
var nock = require('nock');
var expect = require('chai').expect;

nock.disableNetConnect();

var responses = {
    'ya.ru-plain': function () {
        return fs.createReadStream(__dirname + '/mock/ya.ru.html');
    },
    'ya.ru-gzip': function () {
        return fs.createReadStream(__dirname + '/mock/ya.ru.gzip');
    }
};

describe('grabby', function () {
    describe('#requestHtml', function () {
        it('simple html pages', function () {
            var scope = nock('http://ya.ru')
                .get('/')
                .reply(200, responses['ya.ru-plain'], {});

            var request = {url: 'http://ya.ru/'};

            return grabby.requestHtml(request).then(function (html) {
                expect((/<title>Яндекс<\/title>/gi).test(html)).to.equal(true);

                // scope done
                expect(scope.isDone()).to.equal(true);
            });
        });

        it('html pages encoded with gzip', function () {
            var scope = nock('http://ya.ru')
                .get('/')
                .reply(200, responses['ya.ru-gzip'], {'Content-Encoding': 'gzip'});

            var request = {url: 'http://ya.ru/', headers: {'Accept-Encoding': 'gzip'}};

            return grabby.requestHtml(request).then(function (html) {
                expect((/<title>Яндекс<\/title>/gi).test(html)).to.equal(true);

                // scope done
                expect(scope.isDone()).to.equal(true);
            });
        });

        it('few attempts if meet 409', function () {
            var scope = nock('http://ya.ru')
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
                    limit: 10
                }
            };

            return grabby.requestHtml(request).then(function (html) {
                expect((/<title>Яндекс<\/title>/gi).test(html)).to.equal(true);

                // scope done
                expect(scope.isDone()).to.equal(true);
            });
        });

        it('only 1 attempt if limit set to 1', function () {
            var scope = nock('http://ya.ru')
                .get('/')
                .times(1)
                .reply(409, 'too often');

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
                    // scope done
                    expect(scope.isDone()).to.equal(true);
                }
            );
        });

        it('failed on request timeout', function () {
            var scope = nock('http://ya.ru')
                .get('/')
                .delayConnection(2000)
                .reply(200, responses['ya.ru-plain'], {});

            var request = {url: 'http://ya.ru/', timeout: 1};

            return grabby.requestHtml(request).then(
                function () {
                    throw new Error();
                },
                function (err) {
                    expect(err.message).to.equal('ETIMEDOUT');

                    // scope done
                    expect(scope.isDone()).to.equal(true);
                }
            );
        });
    });
});
