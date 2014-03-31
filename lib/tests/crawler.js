var crawler = require('../crawler');

// nodeunit tests/test-worker.js
module.exports.group1 = {
    'crawler1': function(test) {
        var html = crawler.request();
    }
};