var RequestOptions = require('./requestOptions'),
    encoder = require('../utils/encoder'),
    decompress = require('../utils/decompress');

/**
 * Meta information about http request
 *
 * @param {RequestOptions} request
 * @param {Object} response
 * @constructor
 */
function ResponseHandler (request, response) {
    this._request = request;
    this._response = response;
}

/**
 * parse http response and fulfilled meta object
 *
 * @return {vow.Promise}
 */
ResponseHandler.prototype._process = function () {
    var self = this,
        headers = this._response.headers;

    // binary encoded buffer
    var buffer = this._response.body;

    this._compressMethod = this._request.compress || headers['content-encoding'] || null;
    this._encoding = this._request.encoding || this._getEncodingFromHeaders(headers) || 'utf8';

    return this._decompress(buffer).then(function (decompressed) {
        self._body = encoder(decompressed, self._encoding, 'utf8');

        // prepare result
        return self._exposeResult();
    });
};

/**
 * @returns {vow.Promise}
 */
ResponseHandler.prototype._decompress = function (buffer) {
    return decompress(buffer, this._compressMethod);
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
 * Parse string like
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

/**
 * Expose parse result to end-user
 *
 * @return {Object}
 * @private
 */
ResponseHandler.prototype._exposeResult = function () {
    return {
        body: this._body,
        headers: this._headers,
        compressMethod: this._compressMethod,
        encoding: this._encoding,

        // full control
        response: this._response
    };
};

var responseHandler = module.exports = function (req, res) {
    return new ResponseHandler(req, res)._process();
};
