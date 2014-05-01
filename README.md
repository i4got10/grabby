Grabby
====================

Simple tool for http requesting. Support encoding(gzip, deflate) and language decoding(utf8, win1251).

Example
-------

```javascript
    // http://yandex.ru/yandsearch?text=food
    var request = {
        url: 'http://yandex.ru/yandsearch',
        qs: {
            text: 'food'
        }
    };

    require('grabby').grab(request).then(function (html) {
        // for example parse http with cheerio
        var $ = cheerio.load(html);
    });
```

tests
-----

Project uses [https://github.com/caolan/nodeunit](nodeunit) for testing. You can install it and run tests
```bash
    npm install -g nodeunit
    nodeunit tests/crawler.js
```




