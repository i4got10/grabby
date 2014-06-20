Grabby
====================

Simple tool for http requesting. Support encoding(gzip, deflate) and language decoding(utf8, win1251).

Example
-------

```javascript
    var grabby = require('grabby');

    // http://yandex.ru/yandsearch?text=food
    var request = {
        url: 'http://yandex.ru/yandsearch',
        qs: {
            text: 'food'
        }
    };

    // returns vow promise
    grabby.requestHtml(request).then(function (html) {
        // for example parse http with cheerio
        var $ = cheerio.load(html);
    });

    // set fail reason and grabby will continue to try
    // useful if you meet nginx with request per minute limit
    grabby.requestHtml({
        url: '',
        attempt: {
            reason: [409], // status code
            reason: function (error, response) { // or your own reason
                /* check response */
            },
            delay: 100, // constant in ms
            delay: function (nTry) { // or even your custom value
                return 100 * nTry;
            },
            limit: 10 // reject promise after 10 tries
        }
    });

```

tests
-----

```bash
    npm test
```




