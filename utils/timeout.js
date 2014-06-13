var vow = require('vow');

/**
 * @param {Number} time
 *
 * @returns {vow.Promise}
 */
module.exports = function (time) {
    var dfd = new vow.Promise();

    setTimeout(dfd.fulfill, time);

    return dfd;
};
