var request = require('request'),
    sprintf = require('util').format,
    _ = require('lodash'),
    vow = require('vow'),
    RequestOptions = require('./requestOptions'),
    ResponseHandler = require('./responseHandler');

var Crawler = {
    /**
     * Grab data from url
     *
     * @param {Object|RequestOptions} request
     *
     * @returns {vow.Promise}
     */
    request: function (request) {
        var self = this;

        if (!(request instanceof RequestOptions)) {
            request = new RequestOptions(request);
        }

        // create meta object with request result
        var meta = new ResponseHandler(request);

        // request and parse
        return self._request(request).then(function (response) {
            return meta._parseHttpResponse(response);
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
        var d = new vow.Promise();

        var options = requestOptions.getOptions();

        request(options, function (error, response) {
            if (error) {
                // todo check attempt
                throw error;
            }

            var code = response.statusCode;
            if (code !== 200) {
                // todo check attempt
                var err;

                err = sprintf('Http request return %d status, only 200 allowed.', code);

                // redirect
                if ([301, 302].indexOf(code) !== -1) {
                    err += sprintf(' Location header: %s', response.headers.location);
                }

                d.reject(err);
            }

            d.fulfill(response);
        });

        return d;
    }
};

module.exports = Crawler;
