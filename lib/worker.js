var request = require('request'),
    async = require('async'),
    wEvent = require('./event_factory'),
    util = require('util'),
    _ = require('underscore'),
    vow = require('vow'),
    cheerio = require('cheerio'),
    iconv = require('iconv-lite'),
    db = require('./db'),
    zlib = require('zlib'),
    __DIR__ = require('path').dirname(require.main.filename),
    __DS__ = require('path').sep;

var Worker = {
    run: function () {
        // Receive messages from the master process.
        process.on('message', _.bind(this._onMasterMessage, this));

        db.connect();
    },

    _onMasterMessage: function (msg) {
        if (msg === undefined || msg.type === undefined || wEvent.knownEvents.indexOf(msg.type) === -1) {
            return;
        }

        switch (msg.type) {
            case 'event':
            {
                this._onMasterEvent(msg.name, msg.data);
                break;
            }

            case 'command':
            {
                this._onMasterCommand(msg.name, msg.data);
                break;
            }
        }
    },

    /**
     * @param {String} name
     * @param {Object} data
     * @private
     */
    _sendEvent: function (name, data) {
        data = data || {};
        data.pid = process.pid;

        process.send(wEvent.event(name, data));
    },

    /**
     * @param {String} name
     * @param {Object} data
     */
    _onMasterEvent: function (name, data) {

    },

    /**
     * @param {String} name
     * @param {Object} data
     */
    _onMasterCommand: function (name, data) {
        if (this._commands.indexOf(name) === -1) {
            throw new Error('Unknown command ' + name);
        }

        var cmdName = '_onMaster' + name.charAt(0).toUpperCase() + name.slice(1);
        this[cmdName](data);
    },

    /**
     */
    _commands: ['task'],

    /**
     * Command "task"
     *
     * @param {Object} data
     * @param {Array} data.ids
     * @private
     */
    _onMasterTask: function (data) {
        var self = this,
            ids = data.ids;

        console.log('_onMasterTask [' + data.ids + ']');

        vow.all(
            _.map(ids, function (id) {
                return self
                    // request
                    ._requestProduct(id)
                    // save
                    .then(
                        _.bind(self._saveData, self),
                        function(err) {
                            return vow.reject(err);
                        }
                    )
                    // send requestDone
                    .then(
                        function() {
                            console.log('Task %d done!', id);
                            self._sendEvent('requestDone', { id: id });
                        },
                        function(err) {
                            console.log('Task %d failed! %s', id, err);
                            self._sendEvent('requestFailed', { id: id });

                            return vow.reject(err);
                        }
                    );
            })
        )
        // send taskDone
        .always(function() {
            self._sendEvent('taskDone');
        });
    },

    /**
     * @returns {vow:Deferred}
     */
    _requestProduct: function (id) {
        console.log('_requestProduct(%s)', id);
        var self = this;

        // http://gorshkov.ru/catalog/goods/13214/#content
        var url = util.format('http://gorshkov.ru/catalog/goods/%d/', id);

        var meta = {
            id: id,
            url: url,
            host: 'http://gorshkov.ru'
        };

        var d =  self
            ._requestHtml(url)
            .then(
                // success request
                function (response) {
                    return self._unzip(response.body, response.headers['content-encoding']);
                },
                // request failed
                function(err) {
                    return vow.reject('cant get html {' + err + '}');
                }
            )
            .then(
                function (body) {
                    //todo check encoding
                    var html = self._win1251ToUtf(body);
                    return self._parseHtml(html);
                },
                function(err) {
                    return vow.reject(err);
                }
            )
            .then(
                function(data) {
                    meta = _.extend(data, meta);
                    return vow.resolve(meta)
                },
                function(err) {
                    return vow.reject(err);
                }
            );

        return d;
    },

    /**
     * @returns {vow:Deferred}
     */
    _requestHtml: function (url) {
        console.log('_requestHtml ' + url);
        var self = this,
            d = vow.defer();

        var headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:21.0) Gecko/20100101 Firefox/21.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ru,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            // 'Connection': 'keep-alive',
            'Cache-Control': 'max-age=0'
        };

        var options = {
            url: url,
            qs: {},
            method: 'GET',
            headers: headers,
            encoding: null,
            followRedirect: false
        };

        request(options, function (error, response, body) {
            if (error) throw error;

            var code = response.statusCode;
            if (code != 200) {
                // todo
                d.reject(code);
            }

            d.resolve(response);
        });

        return d.promise();
    },

    /**
     * @returns {vow:Deferred}
     */
    _unzip: function (buffer, encoding) {
        console.log('_unzip %s', encoding);
        var self = this,
            d = vow.defer();

        if (encoding === 'gzip') {
            zlib.gunzip(buffer, function (err, dezipped) {
                if (err) throw err;
                d.resolve(dezipped);
            });
        }
        else if (encoding === 'deflate') {
            zlib.inflate(buffer, function (err, dezipped) {
                if (err) throw err;
                d.resolve(dezipped);
            });
        }
        else {
            d.resolve(buffer);
        }

        return d.promise();
    },

    /**
     * win1251 -> utf8
     *
     * @param {Buffer} buffer - binary buffer
     */
    _win1251ToUtf: function (buffer) {
        console.log('_win1251ToUtf');
        var buf = new Buffer(buffer, 'binary');
        buf = iconv.fromEncoding(buf, 'win1251');

        return iconv.toEncoding(buf, 'utf8').toString();
    },

    /**
     * @returns {vow:Deferred}
     */
    _parseHtml: function (html) {
        console.log('_parseHtml');
        var self = this,
            d = vow.defer();

        var $ = cheerio.load(html);

        var item = {},
            $good = $('#goods').find('#goods-item'),
            $dd = $good.find('dl dd'),
            $dt = $good.find('dl dt'),
            $categories = $('#tips').find('a'),
            $gallery = $good.find('a[rel="gallery"]');

        item.name = $('#content').find('h1').text().trim();
        item.description = $good.find('.description span').text().trim();

        $dt.each(function (index, element) {
            var $d = $(this),
                name = $d.text().trim(),
                val = $dd.eq(index).text().trim();

            switch (name) {

                case 'Код товара:':
                    item.code = val;
                    break;

                case 'Цена за штуку:':
                    item.price = self._parseFloat(val);
                    break;

                case 'Цена за упаковку:':
                    item.price_box = self._parseFloat(val);
                    break;

                case 'Количество в упаковке:':
                    var parts = val.split(' ');

                    item.box_amount = parseInt(parts[0]);
                    if (parts.length > 1) {
                        item.unit = parts[1];
                    }

                    break;

                case 'Артикул:':
                    item.articul = val;
                    break;

                default:
                    console.log('Unknown dt %s', name);
                    break;
            }
        });

        item.categories = _.map($categories, function (elem) {
            var $a = $(elem),
                parts = $a.attr('href').split('/');

            return {
                name: $a.text(),
                url: $a.attr('href'),
                id: parts.length >= 4 ? parseInt(parts[2]) : null
            };
        });

        item.images = _.map($gallery, function (elem) {
            var $a = $(elem),
                href = $a.attr('href');

            return {
                url: href
            };
        });

        d.resolve(item);

        return d.promise();
    },

    /**
     * @returns {vow:Deferred}
     */
    _saveData: function (product) {
        console.log('_saveData');
        var self = this;

        return this._saveImages(product).then(function(images) {
            product.images = images;

            return self._saveProduct(product);
        });
    },

    /**
     * @param {Object} product
     * @private
     */
    _saveProduct: function (product) {
        console.log('_saveProduct');
        var d = vow.defer();

        delete product.host;

        var collection = db.collection('products');
        collection.update( {id: product.id}, {$set: product}, {safe: true, upsert: true}, function (err) {
            if (err) {
                throw err;
            } else {
                d.resolve();
            }
        });

        return d.promise();
    },

    /**
     * @param {Object} product
     * @private
     */
    _saveImages: function (product) {
        console.log('_saveImages');

        var self = this,
            d = vow.all(
                _.map(product.images, function(image) {
                    var url = product.host + image.url,
                        parts = url.split('/'),
                        name = parts[parts.length - 1],
                        path = [__DIR__, 'images', name].join(__DS__);

                    return self._requestImage(url).then(function(response) {
                        return self._saveImage(response.body, path)
                    })
                })
            );

        return d;
    },

    _requestImage: function (url) {
        console.log('_requestImage');
        var d = vow.defer();

        var options = {
            url: url,
            method: 'GET',
            encoding: null
        };

        request(options, function (error, response, body) {
            if (error) throw error;

            var code = response.statusCode;
            if (code != 200) {
                // todo
                d.reject(code);
            }

            d.resolve(response);
        });

        return d.promise();
    },

    _saveImage: function(image, path) {
        console.log('_saveImage');
        var d = vow.defer();

        var fs = require('fs');
        fs.writeFile(path, image, function (err) {
            if (err) {
                d.reject(err);
            } else {
                d.resolve(path);
            }
        });

        return d.promise();
    },

    /**
     * @returns {Number}
     */
    _parseFloat: function (str) {
        var val = str
            .replace(/ /gi, '')
            .replace(/,/gi, '.');

        return parseFloat(val);
    },

    /**
     * @return {vow:Promise}
     */
    _getProducts: function(page, perPage, fields ) {
        console.log('_getProducts');
        var d = vow.defer();
        var collection = db.collection('products');

        fields = fields === undefined ? {id: 1} : fields;

        var cursor = collection
            .find({}, {limit: perPage, skip: (page - 1) * perPage, sort:[ ['id', 'asc'] ], fields: fields});

        cursor.toArray(function(err, items) {
            if(err) {
                d.reject(err);
            }
            else {
                d.resolve(items);
            }
        });

        return d.promise();
    },

    /**
     * @return {vow:Promise}
     */
    _getProductsCount: function() {
        var d = vow.defer();
        var collection = db.collection('products');

        collection.count(function(err, count) {
            if(err) {
                d.reject(err);
            }
            else {
                d.resolve(count);
            }
        });

        return d.promise();
    }
};

module.exports = Worker;