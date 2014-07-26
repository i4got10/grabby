# Grabby

[![NPM](https://nodei.co/npm/grabby.png)](https://nodei.co/npm/grabby/)

## Features
 * [request](https://github.com/mikeal/request) compatibility
 * [promise](https://github.com/dfilatov/vow) interface
 * encoding detection(utf8, win1251)
 * compressing detection(gzip, deflate)
 * [debug](https://github.com/visionmedia/debug) support


## Install

```bash
npm install grabby --save
```


## Nice and fancy

```javascript
var grabby = require('grabby');

// same as original node request
var request = {url: 'http://yandex.ru'};

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


## Debug support
Debug mode is provided through the use of the [debug](https://github.com/visionmedia/debug) module. To enable:

```bash
DEBUG=grabby node your_program.js
```

or even in your script

```javascript
// set debug environment
process.env['debug'] = 'grabby';
```

Read the debug module documentation for more details.


## Tests

```bash
npm test
```
