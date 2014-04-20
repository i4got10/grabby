var nock = require('nock'),
    fs = require('fs'),
    util = require('util');

module.exports = {
    /**
     * @param {String} mock ya.ru
     */
    mock: function (mock) {
        console.log(mock);
        switch (mock) {
            case 'ya.ru':
                this._mockYaRu();
                break;
            default:
                throw new Error(util.format('mock "%s" is not defined yet', mock));
        }
    },

    _mockYaRu: function () {
        var headers = {
            Server: 'nginx',
            Date: 'Sun, 20 Apr 2014 06:27:43 GMT',
            'Content-Type': 'text/html; charset=UTF-8',
            'Content-Length': '7619',
            Connection: 'close',
            'Cache-Control': 'no-cache,no-store,max-age=0,must-revalidate',
            Expires: 'Sun, 20 Apr 2014 06:27:44 GMT',
            'Last-Modified': 'Sun, 20 Apr 2014 06:27:44 GMT'
        };
        var scope = nock('http://ya.ru')
            .get('/')
            .reply(200, function(uri, requestBody) {
                //return fs.createReadStream('mock/ya.ru.html');
                return '123';
            }, headers);
    }
};
