var Promise = require('bluebird');

/**
 * @param {Number} time
 *
 * @returns {vow.Promise}
 */
module.exports = function (time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time);
    });
};
