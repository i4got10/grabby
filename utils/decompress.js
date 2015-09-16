var zlib = require('zlib');
var Promise = require('bluebird');

/**
 * @returns {Promise}
 */
module.exports = function decompress(buffer, compressType) {
    return new Promise(function (resolve, reject) {
        if (compressType === 'gzip') {
            zlib.gunzip(buffer, function (err, decompressed) {
                if (err) {
                    reject(err);
                } else {
                    resolve(decompressed);
                }
            });
        } else if (compressType === 'deflate') {
            zlib.inflate(buffer, function (err, decompressed) {
                if (err) {
                    reject(err);
                } else {
                    resolve(decompressed);
                }
            });
        } else {
            resolve(buffer);
        }
    });
};
