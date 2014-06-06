var _ = require('lodash');

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
 * @param {Boolean} [options.followRedirect]
 */
function RequestOptions (options) {
    var defaults = {
        format: null,
        encoding: null,
        compress: null,
        method: 'GET',
        followRedirect: false,
        qs: {},
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:21.0) Gecko/20100101 Firefox/21.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ru,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            // 'Connection': 'keep-alive',
            'Cache-Control': 'max-age=0'
        }
    };

    this._options = _.merge(defaults, options);
}

/**
 * @returns {Object}
 */
RequestOptions.prototype.toHttpRequestOptions = function () {
    return _.extend(_.pick(this._options, ['url', 'qs', 'method', 'headers', 'followRedirect']), {
        encoding: null
    });
};

module.exports = RequestOptions;
