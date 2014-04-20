var request = require('request'),
    util = require('util'),
    _ = require('underscore'),
    vow = require('vow'),
    encoder = require('../utils/encoder'),
    decompress = require('../utils/decompress');

/**
 * @constructor
 * @param {Object} options
 *
 * @param {String} options.url - url
 * @param {String} [options.format] - html|json|xml|text, предпочитаемый формат. По умолчанию формат берется из заголовка XXX
 * @param {String} [options.encoding] - utf8|win1251, предпочитаемая кодировка. По умолчанию формат берется из заголовка XXX
 * @param {String} [options.compress]
 * @param {Object} [options.headers]
 * @param {Object} [options.qs]
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
        compress: null,
        method: 'GET',
        qs: {},
        headers: _.extend(headers, options.headers || {})
    };

    this._options = _.extend(defaults, _.omit(options, 'headers'));
}

/**
 * @returns {Object}
 */
RequestMeta.prototype.toHttpRequestOptions = function () {
    return {
        url: this._options.url,
        qs: this._options.qs,
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

    this._compressMethod = this.request._options.compress || this._headers['content-encoding'] || null;
    this._encoding = this.request._options.encoding || this._getEncodingFromHeaders(this._headers) || 'utf8';

    return this._decompress().then(function (decompressed) {
        self._body = encoder(decompressed, self._encoding, 'utf8');
        return self._body;
    });
};

/**
 * @returns {vow.Deferred}
 */
HttpMeta.prototype._decompress = function () {
    return decompress(this._buffer, this._compressMethod);
};

/**
 * @param {Object} headers
 * @returns {string}
 * @private
 */
HttpMeta.prototype._getEncodingFromHeaders = function (headers) {
    return this._parseHeader(headers['content-type']).charset;
};

/**
 * парсит заголовок вида
 * Cache-Control: max-age=3600, must-revalidate, no-cache
 * { max-age=3600, must-revalidate=true, no-cache=true }
 *
 * @param {String} header
 * @returns {Object}
 * @private
 */
HttpMeta.prototype._parseHeader = function (header) {
    if (!header) {
        return {};
    }

    return header.split(',').reduce(function (result, item) {
        item = item.trim().split('=');

        result[item[0]] = typeof item[1] === 'undefined' ? true : Number(item[1]) || 0;

        return result;
    }, {});
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
     * todo
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
