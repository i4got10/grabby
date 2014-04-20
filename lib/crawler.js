var request = require('request'),
    util = require('util'),
    _ = require('underscore'),
    vow = require('vow'),
    //cheerio = require('cheerio'),
    iconv = require('iconv-lite'),
    zlib = require('zlib'),
    __DIR__ = require('path').dirname(require.main.filename),
    __DS__ = require('path').sep;

/**
 * @returns {vow.Deferred}
 */
function decompress (buffer, compressType) {
    console.log('_decompress %s', compressType);
    var self = this,
        d = vow.defer();

    if (compressType === 'gzip') {
        zlib.gunzip(buffer, function (err, decompressed) {
            if (err) {
                d.reject(err);
            } else {
                d.resolve(decompressed);
            }
        });
    }
    else if (compressType === 'deflate') {
        zlib.inflate(buffer, function (err, decompressed) {
            if (err) {
                d.reject(err);
            } else {
                d.resolve(decompressed);
            }
        });
    }
    else {
        d.resolve(buffer);
    }

    return d.promise();
}

/**
 * win1251 -> utf8
 *
 * @param {Buffer} buffer - binary buffer
 */
function bufferToEncoding (buffer, encoding) {
    console.log('_encoding');
    var buf = new Buffer(buffer, 'binary');
    buf = iconv.fromEncoding(buf, 'win1251');

    return iconv.toEncoding(buf, 'utf8').toString();
}

/**
 * @constructor
 * @param {Object} options
 *
 * @param {String} options.url - url
 * @param {String} [options.format] - html|json|xml|text, предпочитаемый формат. По умолчанию формат берется из заголовка XXX
 * @param {String} [options.encoding] - utf8|win1251, предпочитаемая кодировка. По умолчанию формат берется из заголовка XXX
 */
function RequestMeta (options) {
    var headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:21.0) Gecko/20100101 Firefox/21.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        // 'Connection': 'keep-alive',
        'Cache-Control': 'max-age=0'
    };

    var defaults = {
        format: null,
        encoding: null,
        method: 'GET',
        headers: headers
    };

    this._options = _.extend(defaults, options);
}

/**
 * @returns {Object}
 */
RequestMeta.prototype.toHttpRequestOptions = function () {
    return {
        url: this._options.url,
        qs: {},
        method: this._options.method,
        headers: this._options.headers,
        encoding: null,
        followRedirect: false
    };
};

/**
 * Meta information about http request
 *
 * @param {RequestMeta|Object} request
 * @constructor
 */
function HttpMeta (request) {
    if (!(request instanceof RequestMeta)) {
        request = new RequestMeta(request);
    }

    this.request = request;
}
/**
 * @param {Object} response
 */
HttpMeta.prototype.parseHttpResponse = function (response) {
    var self = this;
    this._response = response; // for debug
    this._headers = response.headers;
    this._buffer = response.body;

    this._compressMethod = this._headers['content-encoding'] || null;

    return this.decompress().then(function (decompressed) {
        self._body = bufferToEncoding(decompressed);
        return self._body;
    });
};

/**
 * @returns {vow.Deferred}
 */
HttpMeta.prototype.decompress = function () {
    return decompress(this._buffer, this._compressMethod);
};



var Crawler = {
    /**
     * Grab data from url
     *
     * @param {Object|RequestMeta} request @see RequestMeta
     *
     * @returns {vow.Deferred}
     */
    grab: function (request) {
        var self = this;

        // create object with grab result
        var meta = new HttpMeta(request);

        return self._requestHtml(meta)
            .then(_.bind(meta.parseHttpResponse, meta))
            .then(function (result) {
                return result;
            });
    },

    /**
     * @param {HttpMeta} meta
     *
     * @returns {vow.Deferred}
     */
    _requestHtml: function (meta) {
        var self = this,
            d = vow.defer();

        var options = meta.request.toHttpRequestOptions();

        request(options, function (error, response) {
            if (error) {
                throw error;
            }

            var code = response.statusCode;
            if (code !== 200) {
                // todo
                d.reject(code);
            }

            d.resolve(response);
        });

        return d.promise();
    },

    /**
     * @returns {Number}
     */
    parseFloat: function (str) {
        var val = str
            .replace(/ /gi, '')
            .replace(/,/gi, '.');

        return parseFloat(val);
    }
};

module.exports = Crawler;
