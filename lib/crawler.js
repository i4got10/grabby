var _ = require('lodash');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var sprintf = require('util').format;
var debug = require('debug')('grabby');

var RequestOptions = require('./requestOptions');
var responseHandler = require('./responseHandler');

/**
 * @returns {Boolean}
 * @private
 */
function isAttempt(req, err, response) {
    var a = req.attempt;

    if (!a) {
        return false;
    }

    if (a.limit !== 0 && a.n + 1 >= a.limit) {
        return false;
    }

    if (_.isFunction(a.reason)) {
        return a.reason(err, response);
    } else if (_.isArray(a.reason)) {
        return response && a.reason.indexOf(response.statusCode) !== -1;
    } else {
        return response && response.statusCode === a.reason;
    }
}

/**
 * @param {RequestOptions} requestOptions
 *
 * @returns {Promise}
 */
function doRequest(requestOptions) {
    var options = requestOptions.getOptions();

    debug('%s %s', options.method, options.url);
    return request(options)
        // request return (error, response, body)
        .spread(function (response) {
            var code = response.statusCode;

            debug(code);

            if (code !== 200) {
                if (isAttempt(requestOptions, null, response)) {
                    return doAttempt(requestOptions);
                }

                var message = sprintf('Http request returned response with %s code, but only 200 allowed.', code);

                // redirect helping message
                if ([301, 302, 307].indexOf(code) !== -1) {
                    message += sprintf(' Location: %s', response.headers.location);
                }

                var err = new Error(message);
                err.request = options;
                err.response = response;
                throw err;
            }

            return response;
        })
        .catch(function (err) {
            if (isAttempt(requestOptions, err, null)) {
                return doAttempt(requestOptions);
            }

            throw err;
        });
}

/**
 * @param {RequestOptions} req
 * @returns {Promise}
 * @private
 */
function doAttempt(req) {
    var a = req.attempt;

    // increase counter
    a.n += 1;

    // timeout and request
    var delay = _.isFunction(a.delay) ? a.delay(a.n) : a.delay;
    return Promise.delay(delay).then(function () {
        return doRequest(req);
    });
}

function processRequest(request) {
    request = new RequestOptions(request);

    // request and parse
    return doRequest(request).then(function (response) {
        return responseHandler(request, response);
    });
}

function processRequestHtml(request) {
    return processRequest(request).then(function (response) {
        return response.body;
    });
}

module.exports = {
    /**
     * Request to url
     *
     * @param {Object} request
     *
     * @returns {Promise}
     */
    request: processRequest,

    /**
     * Shortcut method to request html
     *
     * @param {Object|RequestOptions} request
     *
     * @returns {Promise}
     */
    requestHtml: processRequestHtml
};
