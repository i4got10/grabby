var _ = require('lodash');

/**
 * @typedef {Object} AttemptOptions
 * @property {Number|Function} delay
 * @property {Number} limit
 * @property {Number|Function} reason
 */

/**
 * @constructor
 * @param {Object} options - see request to all available options
 *
 * @param {String} options.url - url
 * @param {String} [options.encoding] - utf8|win1251, предпочитаемая кодировка. По умолчанию формат берется из заголовка XXX
 * @param {String} [options.compress] - gzip|deflate
 * @param {AttemptOptions} [options.attempt] - attempt options
 */
function RequestOptions (options) {
    // for internal usage
    this.encoding = options.encoding;
    this.compress = options.compress;
    this.attempt = this._parseAttemptOptions(options.attempt);

    // defaults
    var defaults = {
        method: 'GET',
        followRedirect: false,
        // typical ff headers
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:21.0) Gecko/20100101 Firefox/21.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ru,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            // 'Connection': 'keep-alive',
            'Cache-Control': 'max-age=0'
        }
    };

    // process options
    this._options = _.merge(
        defaults,
        // user can pass any request options
        _.omit(options, ['attempt', 'compress', 'encoding']),
        // reset some options
        {
            // need binary data for right encoding and decompress
            encoding: null
        }
    );
}

/**
 * @returns {Object}
 */
RequestOptions.prototype.getOptions = function () {
    return this._options;
};

/**
 * @param {AttemptOptions} attemptOption
 */
RequestOptions.prototype._parseAttemptOptions = function (attemptOption) {
    // reason required
    if (!attemptOption || !attemptOption.reason) {
        return;
    }

    var attempt = _.merge({
        delay: 0,
        limit: 3
    }, attemptOption);

    if (_.isFunction(attempt.delay)) {
        attempt._isDelayFunc = true;
    } else {
        attempt.delay = Number(attempt.delay);
    }

    if (_.isFunction(attempt.reason)) {
        attempt._isReasonFunc = true;
    } else {
        attempt.reason = Number(attempt.reason);
    }

    attempt._n = 0;

    return attempt;
};

module.exports = RequestOptions;
