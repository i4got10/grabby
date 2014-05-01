var nock = require('nock'),
    fs = require('fs'),
    sprintf = require('util').format,
    _ = require('lodash');

module.exports = {
    /**
     */
    enableHttpMocks: function () {
        this._mockYaRu();
    },

    /**
     */
    _mockYaRu: function () {
        var headers = {
            'Content-Type': 'text/html; charset=UTF-8',
            'Content-Length': '7619'
        };

        nock('http://ya.ru')
            //.matchHeader('Accept-Encoding', /gzip/)
            .get('/zipped')
            .reply(200, function(uri, requestBody) {
                return fs.createReadStream('tests/mock/ya.ru.gzip');
            }, _.extend({}, headers, {'Content-Encoding': 'gzip'}));

        nock('http://ya.ru')
            .get('/unzipped')
            .reply(200, function(uri, requestBody) {
                return fs.createReadStream('tests/mock/ya.ru.html');
            }, headers);
    }
};
