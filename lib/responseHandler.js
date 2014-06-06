var RequestOptions = require('./requestOptions'),
    encoder = require('../utils/encoder'),
    decompress = require('../utils/decompress');

/**
 * Meta information about http request
 *
 * @param {RequestOptions|Object} request
 * @constructor
 */
function ResponseHandler (request) {
    if (!(request instanceof RequestOptions)) {
        request = new RequestOptions(request);
    }

    this.request = request;
}

/**
 * @param {Object} response
 */
ResponseHandler.prototype.parseHttpResponse = function (response) {
    var self = this;

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
 * @returns {vow.Promise}
 */
ResponseHandler.prototype._decompress = function () {
    return decompress(this._buffer, this._compressMethod);
};

/**
 * @param {Object} headers
 * @returns {string}
 * @private
 */
ResponseHandler.prototype._getEncodingFromHeaders = function (headers) {
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
ResponseHandler.prototype._parseHeader = function (header) {
    if (!header) {
        return {};
    }

    return header.split(',').reduce(function (result, item) {
        item = item.trim().split('=');

        result[item[0]] = typeof item[1] === 'undefined' ? true : Number(item[1]) || 0;

        return result;
    }, {});
};

module.exports = ResponseHandler;
