var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var sprintf = require('util').format;
var timeout = require('../utils/timeout');
var debug = require('debug')('grabby');

var RequestOptions = require('./requestOptions');
var responseHandler = require('./responseHandler');

var Crawler = {
    /**
     * Request to url
     *
     * @param {Object} request
     *
     * @returns {Promise}
     */
    request: function (request) {
        request = new RequestOptions(request);

        // request and parse
        return this._request(request).then(function (response) {
            return responseHandler(request, response);
        });
    },

    /**
     * Shortcut method to request html
     *
     * @param {Object|RequestOptions} request
     *
     * @returns {Promise}
     */
    requestHtml: function (request) {
        return this.request(request).then(function (response) {
            return response.body;
        });
    },

    /**
     * @param {RequestOptions} requestOptions
     *
     * @returns {Promise}
     */
    _request: function (requestOptions) {
        var crawler = this;
        var options = requestOptions.getOptions();

        debug('%s %s', options.method, options.url);
        return request(options)
            // request return (error, response, body)
            .spread(function (response) {
                var code = response.statusCode;

                debug(code);

                if (code !== 200) {
                    if (crawler._isAttempt(requestOptions, null, response)) {
                        return crawler._attempt(requestOptions);
                    }

                    var err = sprintf('Http request returned response with %s code, but only 200 allowed.', code);

                    // redirect helping message
                    if ([301, 302].indexOf(code) !== -1) {
                        err += sprintf(' Location: %s', response.headers.location);
                    }

                    throw new Error(err);
                }

                return response;
            })
            .catch(function (err) {
                if (crawler._isAttempt(requestOptions, err, null)) {
                    return crawler._attempt(requestOptions);
                }

                throw err;
            });
    },

    /**
     * @param {RequestOptions} req
     * @returns {Promise}
     * @private
     */
    _attempt: function (req) {
        var crawler = this,
            a = req.attempt;

        // increase counter
        a._n += 1;

        // timeout and request
        var delay = a._isDelayFunc ? a.delay(a._n) : a.delay;
        return timeout(delay).then(function () {
            return crawler._request(req);
        });
    },

    /**
     * @returns {Boolean}
     * @private
     */
    _isAttempt: function (req, err, response) {
        var a = req.attempt;

        if (!a) {
            return false;
        }

        if (a.limit !== 0 && a._n + 1 >= a.limit) {
            return false;
        }

        if (a._isReasonFunc) {
            return a.reason(err, response);
        } else {
            return response && response.statusCode === a.reason;
        }
    }
};

module.exports = Crawler;
