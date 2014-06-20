var vow = require('vow');

/**
 * @param {Number} time
 *
 * @returns {vow.Promise}
 */
module.exports = function (time) {
    var d = vow.defer();

    setTimeout(function () {
        d.resolve();
    }, time);

    return d.promise();
};
