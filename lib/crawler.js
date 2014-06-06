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
     * @param {Object|RequestOptions} request @see RequestOptions
     *
     * @returns {vow.Promise}
     */
    grab: function (request) {
        var self = this;

        // create object with grab result
        var meta = new ResponseHandler(request),
            parse = _.bind(meta.parseHttpResponse, meta);

        return self
            ._requestHtml(meta)
            .then(parse);
    },

    /**
     * @param {ResponseHandler} meta
     *
     * @returns {vow.Promise}
     */
    _requestHtml: function (meta) {
        var d = new vow.Promise();

        var options = meta.request.toHttpRequestOptions();

        request(options, function (error, response) {
            if (error) {
                throw error;
            }

            var code = response.statusCode;
            if (code !== 200) {
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
