var util = require('util'),
    iconv = require('iconv-lite');

/**
 * @param {String} encoding
 * @returns {*}
 * @private
 */
function _extractEncoding(encoding) {
    var e = encoding.toLowerCase();
    if (['utf-8', 'utf8'].indexOf(encoding)) {
        e = 'utf8';
    } else if (['win1251', 'windows-1251'].indexOf(encoding)) {
        e = 'win1251';
    } else {
        throw new Error(util.format('Encoding "%s" is not supported yet', encoding));
    }

    return e;
}

/**
 * encode data from binary buffer with "encodeFrom" to "encodeTo"
 * example, html page contains win1251 data which loaded to binary buffer
 * so first, need to translate data from win1251 to internal encoding
 *
 * @param {Buffer} buffer binary buffer
 * @param {String} encodeFrom utf8|win1251
 * @param {String} encodeTo utf8|win1251
 * @return {String}
 */
module.exports = function (buffer, encodeFrom, encodeTo) {
    var from = _extractEncoding(encodeFrom),
        to = _extractEncoding(encodeTo);

    var buf;

    // from source encoding to internal
    buf = iconv.fromEncoding(buffer, from);

    // from internal encoding to target
    return iconv.toEncoding(buf, to).toString();
};
