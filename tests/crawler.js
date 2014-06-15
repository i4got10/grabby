/*global describe, before, after, it, afterEach, beforeEach, done */

var grabby = require('../lib/crawler'),
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

            var request = {url: 'http://ya.ru/'};

            grabby.requestHtml(request).then(function (html) {
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

            grabby.requestHtml(request).then(function (html) {
                assert.equal(true, (/<title>Яндекс<\/title>/gi).test(html));
            }).done();
        });

        it('can make some attempt if meet 409', function () {
            nock('http://ya.ru')
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
                    timeout: 0,
                    limit: 10
                }
            };

            grabby.requestHtml(request).then(function (html) {
                assert.equal(true, (/<title>Яндекс<\/title>/gi).test(html));
            }).done();
        });
    });
});
/*

https://github.com/pgte/nock/issues/new

Hi!

    Is it possible to answer the same query with different results depending on conditions?

    For example, I want three times to answer 409 error, and then give the data with 200 code. Reason is to test if the server can only process n request per minute, and I want to make several attempts with timeout. So, I want to simulate request per time limit

```javascript
nock('http://example.com')
    .get('/')
    .times(3)
    .reply(409, 'too often')

    .get('/')
    .times(1)
    .reply(200, {result: 'success'});
```
*/
