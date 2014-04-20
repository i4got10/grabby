var zlib = require('zlib'),
    vow = require('vow');

/**
 * @returns {vow.Deferred}
 */
module.exports = function decompress (buffer, compressType) {
    var self = this,
        d = vow.defer();

    if (compressType === 'gzip') {
        zlib.gunzip(buffer, function (err, decompressed) {
            if (err) {
                d.reject(err);
            } else {
                d.resolve(decompressed);
            }
        });
    }
    else if (compressType === 'deflate') {
        zlib.inflate(buffer, function (err, decompressed) {
            if (err) {
                d.reject(err);
            } else {
                d.resolve(decompressed);
            }
        });
    }
    else {
        d.resolve(buffer);
    }

    return d.promise();
};
