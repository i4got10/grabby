var request = require('request'),
    sprintf = require('util').format,
    vow = require('vow'),
    timeout = require('../utils/timeout'),
    debug = require('debug')('grabby'),
    RequestOptions = require('./requestOptions'),
    responseHandler = require('./responseHandler');

var Crawler = {
    /**
     * Request to url
     *
     * @param {Object|RequestOptions} request
     *
     * @returns {vow.Promise}
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
     * @returns {vow.Promise}
     */
    requestHtml: function (request) {
        return this.request(request).then(function (response) {
            return response.body;
        });
    },

    /**
     * @param {RequestOptions} requestOptions
     *
     * @returns {vow.Promise}
     */
    _request: function (requestOptions) {
        var crawler = this,
            d = vow.defer();

        var options = requestOptions.getOptions();

        debug('%s %s', options.method, options.url);
        request(options, function (error, response) {
            var code = response.statusCode;

            debug(code);
            // TODO can we provide response here?
            if (error || code !== 200) {
                if (crawler._isAttempt(requestOptions, error, response)) {
                    d.resolve(crawler._attempt(requestOptions));
                    return;
                }

                if (error) {
                    d.reject(error);
                    return;
                }

                var err = sprintf('Http request returned response with %s code, but only 200 allowed.', code);

                // redirect
                if ([301, 302].indexOf(code) !== -1) {
                    err += sprintf(' Location: %s', response.headers.location);
                }

                d.reject(new Error(err));
                return;
            }

            d.resolve(response);
        });

        return d.promise();
    },

    /**
     * @param {RequestOptions} req
     * @returns {vow.Promise}
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

        // the condition will not run on the next tick if limit reached
        if (a.limit !== 0 && a._n >= a.limit) {
            return false;
        }

        if (a._isReasonFunc) {
            return a.reason(err, response);
        } else {
            return response.statusCode === a.reason;
        }
    }
};

module.exports = Crawler;
