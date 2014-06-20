# Grabby

[![NPM](https://nodei.co/npm/grabby.png)](https://nodei.co/npm/grabby/)

Simple tool for collecting web pages. Support compressing(gzip, deflate) and language decoding(utf8, win1251).

## Install

```bash
    npm install grabby --save
```

## Nice and fancy

```javascript
    var grabby = require('grabby');

    // same as original node request
    var request = {url: 'http://yandex.ru};

    // returns vow promise
    grabby.requestHtml(request).then(function (html) {
        // for example parse http with cheerio
        var $ = cheerio.load(html);
    });
```

## Advanced usage

```javascript
    var grabby = require('grabby');

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
            delay: function (n) { // or even your custom value
                return 100 * n;
            },
            limit: 10 // reject promise after 10 tries
        }
    });

```

## Tests

```bash
    npm test
```




