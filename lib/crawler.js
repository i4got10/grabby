var request = require('request'),
    async = require('async'),
    util = require('util'),
    _ = require('underscore'),
    vow = require('vow'),
    cheerio = require('cheerio'),
    iconv = require('iconv-lite'),
    zlib = require('zlib'),
    __DIR__ = require('path').dirname(require.main.filename),
    __DS__ = require('path').sep;

var Crawler = {
    /**
     * @returns {vow:Deferred}
     */
    request: function (url) {
        var self = this;

        var meta = {
            url: url
        };

        var d =  self
            ._requestHtml(url)
            .then(
                // success request
                function (response) {
                    var r = _.extend(meta, {
                        response: response
                    });

                    r.content = self._unzip(response.body, response.headers['content-encoding']);
                    return r;
                },
                null
            )
            .then(
                function (r) {
                    //todo check encoding
                    r.content = self._encoding(r.content, r.response.headers['content-type']);

                    return r;
                },
                null
            );

        return d;
    },

    /**
     * @returns {vow:Deferred}
     */
    _requestHtml: function (url) {
        console.log('_requestHtml ' + url);
        var self = this,
            d = vow.defer();

        var headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:21.0) Gecko/20100101 Firefox/21.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ru,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            // 'Connection': 'keep-alive',
            'Cache-Control': 'max-age=0'
        };

        var options = {
            url: url,
            qs: {},
            method: 'GET',
            headers: headers,
            encoding: null,
            followRedirect: false
        };

        request(options, function (error, response, body) {
            if (error) throw error;

            var code = response.statusCode;
            if (code != 200) {
                // todo
                d.reject(code);
            }

            d.resolve(response);
        });

        return d.promise();
    },

    /**
     * @returns {vow:Deferred}
     */
    _unzip: function (buffer, encoding) {
        console.log('_unzip %s', encoding);
        var self = this,
            d = vow.defer();

        if (encoding === 'gzip') {
            zlib.gunzip(buffer, function (err, dezipped) {
                if (err) throw err;
                d.resolve(dezipped);
            });
        }
        else if (encoding === 'deflate') {
            zlib.inflate(buffer, function (err, dezipped) {
                if (err) throw err;
                d.resolve(dezipped);
            });
        }
        else {
            d.resolve(buffer);
        }

        return d.promise();
    },

    /**
     * win1251 -> utf8
     *
     * @param {Buffer} buffer - binary buffer
     */
    _encoding: function (buffer, encoding) {
        console.log('_encoding');
        var buf = new Buffer(buffer, 'binary');
        buf = iconv.fromEncoding(buf, 'win1251');

        return iconv.toEncoding(buf, 'utf8').toString();
    },

    /**
     * @returns {Number}
     */
    _parseFloat: function (str) {
        var val = str
            .replace(/ /gi, '')
            .replace(/,/gi, '.');

        return parseFloat(val);
    }
};

module.exports = Crawler;