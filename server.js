// Generated by LiveScript 1.6.0
(function(){
  var get, ref$, readFileSync, writeFileSync, existsSync, express, template, fetchBase64, cors, ge, getFile, saveFile, getCached, base, getToken, getCachedToken, app;
  get = require('superagent').get;
  ref$ = require('fs'), readFileSync = ref$.readFileSync, writeFileSync = ref$.writeFileSync, existsSync = ref$.existsSync;
  express = require('express');
  template = require('./template.json');
  fetchBase64 = require('fetch-base64');
  cors = require('cors');
  ge = require('greenlock-express');
  getFile = function(name, cb){
    var data, obj;
    data = readFileSync(name, 'utf8');
    obj = JSON.parse(data);
    return cb(null, obj);
  };
  saveFile = function(name, data, cb){
    var str;
    str = JSON.stringify(data);
    writeFileSync(name, str);
    return cb(null);
  };
  getCached = function(url, cb){
    var name;
    name = './cache/' + url.replace(/\//g, '_');
    if (existsSync(name)) {
      return getFile(name, cb);
    }
    return get(url).end(function(err, data){
      if (err != null) {
        return cb(err);
      }
      return saveFile(name, data.body, function(err){
        if (err != null) {
          return cb(err);
        }
        return cb(null, data.body);
      });
    });
  };
  base = "https://api.coingecko.com/api/v3";
  getToken = function(contract_address, cb){
    return getCached(base + "/coins/ethereum/contract/" + contract_address, function(err, data){
      var info;
      info = (import$({}, template));
      return fetchBase64.remote(data.image.small).then(function(image){
        var SYMBOL, usdUrl;
        info.image = image[1];
        info.token = data.symbol;
        SYMBOL = data.symbol.toUpperCase();
        usdUrl = "https://min-api.cryptocompare.com/data/pricemulti?fsyms=" + SYMBOL + "&tsyms=USD";
        return getCached(usdUrl, function(err, data){
          info.usdInfo = (function(){
            switch (false) {
            case err != null:
              return "url(" + usdUrl + ")." + SYMBOL + ".USD";
            default:
              return "0.01";
            }
          }());
          info.mainnet.address = contract_address;
          return getCached("http://api.ethplorer.io/getTokenInfo/" + contract_address + "?apiKey=freekey", function(err, tokenInfo){
            if (err != null) {
              return cb(err);
            }
            info.mainnet.decimals = +tokenInfo.decimals;
            return cb(null, info);
          });
        });
      });
    });
  };
  getCachedToken = function(contract_address, cb){
    var name;
    name = './cache/' + contract_address;
    if (existsSync(name)) {
      return getFile(name, cb);
    }
    return getToken(contract_address, function(err, data){
      if (err != null) {
        return cb(err);
      }
      return saveFile(name, data, function(err){
        if (err != null) {
          return cb(err);
        }
        return cb(null, data);
      });
    });
  };
  app = express();
  app.use(cors());
  app.get('/token/:contract_address', function(req, res){
    return getCachedToken(req.params.contract_address, function(err, data){
      if (err != null) {
        return res.status(400).send(err + "");
      }
      return res.send(data);
    });
  });
  require('greenlock-express').create({
    email: 'some@gmail.com',
    agreeTos: true,
    configDir: './.ssl/',
    communityMember: true,
    telemetry: false,
    app: app,
    debug: true
  }).listen(80, 443);
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);
