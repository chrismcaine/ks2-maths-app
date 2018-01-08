var DbFactory = function (settings) {
    var _settings = settings;
    var _sets = {};
    var _db = null;


    this.AddSet = function (name, model, primaryKey) {
        _sets[name] = { model: model.Model, primaryKey: primaryKey };
    }

    this.RequestDb = function () {
        if (_db === null) {
            return this.Init();
        }
        return Rx.Observable.just(_db);
    }

    this.Init = function () {
        var _this = this;
        return Rx.Observable.create(function (observe) {

            var request = window.indexedDB.open(_settings.name, _settings.version);
            request.onsuccess = function () {
                _db = request.result;
                observe.onNext(request.result);
            }
            request.onerror = function (err) {
                observe.onError(err);
            }

            request.onupgradeneeded = function (evt) {
                console.log('upgrade', _sets);

                for (var dbSet in _sets) {
                    var objStore = evt.target.result.createObjectStore(dbSet, { keyPath: _sets[dbSet].primaryKey });
                    for (var prop in _sets[dbSet].model) {
                        if (_sets[dbSet].primaryKey !== prop) {
                            objStore.createIndex(prop, prop, { unique: _sets[dbSet].model[prop] === true });
                        }
                    }
                }
            }
        });
    }
}

DbFactory.Get = function (arr) {
    var key = arr[0], dbSet = arr[1];
    return dbSet.Get(key);
}

DbFactory.Query = function (arr) {
    var queryObj = arr[0], dbSet = arr[1];
    return dbSet.Query(queryObj);
}

DbFactory.Save = function (arr) {
    var obj = arr[0], dbSet = arr[1];
    return dbSet.Save(obj);
}

DbFactory.Add = function (arr) {
    var obj = arr[0], dbSet = arr[1];
    return dbSet.Add(obj);
}

DbFactory.Delete = function (arr) {
    var key = arr[0], dbSet = arr[1];
    return dbSet.Delete(key);
}
DbFactory.MapMethod = function (method) {
    var _method = method;
    return function (arr) {
        var val = arr[0], dbSet = arr[1];
        return dbSet[_method](val);
    };
}

var DbSet = function (name, primaryKey, model, dbFactory) {
    var _name = name;
    var _primaryKey = primaryKey;
    var _model = model;

    var _dbFactory = dbFactory;

    _dbFactory.AddSet(_name, _model, _primaryKey);

    var _getDb = function () {
        return _dbFactory.RequestDb();
    }

    var _test = function (obj, query) {
        if (query === null) return true;
        var result = false;
        if (query.Match.toLowerCase() === 'all') {
            result = true;
            query.Keys.forEach(function (key, i) {
                result = result && new RegExp(query.Value, 'gi').test(obj[key]);
            });
        } else {
            for (var i = 0; i < query.Keys.length; i += 1) {
                if (new RegExp(query.Value, 'gi').test(obj[query.Keys[i]]) === true) return true;
            };
        }
        return result;
    }

    var returnObj = {
        Query: function (queryObj) {
            var _queryObj = queryObj;
            return _getDb().map(function (db) {
                return Rx.Observable.create(function (observe) {
                    var results = [];
                    var objStore = db.transaction(_name).objectStore(_name);

                    objStore.openCursor().onsuccess = function (evt) {

                        var cursor = evt.target.result;
                        if (cursor) {
                            //if (_test(cursor.value, _queryObj)) {
                                results.push(cursor.value);
                            //}
                            cursor.continue();
                        } else {
                            observe.onNext(new Queryable(results));
                        }
                    };
                });
            }).switch();
        },
        Get: function (key) {
            if (typeof key === 'object') key = key[_primaryKey];
            return _getDb().map(function (db) {
                return Rx.Observable.create(function (observe) {
                    var objStore = db.transaction([_name], 'readwrite').objectStore(_name);

                    var objStrReq = objStore.get(key);
                    objStrReq.onsuccess = function () {
                        observe.onNext(objStrReq.result);
                    }

                    objStrReq.onerror = function (err) {
                        observe.onError(err);
                    }

                });
            }).switch();
        },
        Save: function (obj) {
            console.log('save', obj);
            return _getDb().map(function (db) {
                return Rx.Observable.create(function (observe) {
                    var objStore = db.transaction([_name], 'readwrite').objectStore(_name);
                    var objStrReq = objStore.get(obj[_primaryKey]);

                    objStrReq.onsuccess = function () {

                        var req;
                        if (objStrReq.result !== undefined || objStrReq.result !== null) {
                            req = objStore.put(obj);
                        } else {
                            req = objStore.add(obj);
                        }

                        req.onsuccess = function () {
                            observe.onNext(obj);
                        }

                        req.onerror = function (err) {
                            observe.onError(err);
                        }
                    }

                    objStrReq.onerror = function (err) {
                        observe.onError(err);
                    }

                });
            }).switch();
        },
        Add: function (obj) {
            console.log('add', obj);
            return _getDb().map(function (db) {
                return Rx.Observable.create(function (observe) {
                    var objStore = db.transaction([_name], 'readwrite').objectStore(_name);

                    var req = objStore.add(obj);
                    
                    req.onsuccess = function () {
                        observe.onNext(obj);
                    }

                    req.onerror = function (err) {
                        observe.onError(err);
                    }

                });
            }).switch();
        },
        Delete: function (key) {
            if (typeof key === 'object') key = key[_primaryKey];
            return _getDb().map(function (db) {
                return Rx.Observable.create(function (observe) {
                    var objStore = db.transaction([_name], 'readwrite').objectStore(_name);

                    var objStrReq = objStore.get(key);
                    objStrReq.onsuccess = function () {
                        var req;
                        if (objStrReq.result !== undefined || objStrReq.result !== null) {
                            req = objStore.delete(key);
                        }

                        req.onsuccess = function () {
                            observe.onNext(objStrReq.result);
                        }

                        req.onerror = function (err) {
                            observe.onError(err);
                        }
                    }

                    objStrReq.onerror = function (err) {
                        observe.onError(err);
                    }
                });
            }).switch();
        }
    };

    return Rx.Observable.just(returnObj);
}