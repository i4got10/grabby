var zlib = require('zlib'),
    vow = require('vow');

/**
 * @returns {vow.Promise}
 */
module.exports = function decompress (buffer, compressType) {
    var d = new vow.Promise();

    if (compressType === 'gzip') {
        zlib.gunzip(buffer, function (err, decompressed) {
            if (err) {
                d.reject(err);
            } else {
                d.fulfill(decompressed);
            }
        });
    }
    else if (compressType === 'deflate') {
        zlib.inflate(buffer, function (err, decompressed) {
            if (err) {
                d.reject(err);
            } else {
                d.fulfill(decompressed);
            }
        });
    }
    else {
        d.fulfill(buffer);
    }

    return d;
};
