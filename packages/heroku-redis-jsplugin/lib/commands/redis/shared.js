var Heroku = require('heroku-client');

var HOST = "redis-api.heroku.com";
var PATH=  "/redis/v0/databases";
var PREFIX = "HEROKU_REDIS"
var ADDON = "heroku-redis"

function request(context, path, method) {
  return Heroku.request( {
    method: method || "GET",
    path: PATH+"/"+path,
    host: HOST,
    auth: context.auth.username+":"+context.auth.password,
    headers: {
      'Accept': 'application/json',
    },
  })
}

function make_addons_filter(filter) {
  if (filter) {
    filter = filter.toUpperCase();
    var p = PREFIX.toUpperCase();
    if (filter.indexOf(p) != 0) {
      filter = p+"_"+filter+"_URL";
    }
  }

  function matches (addon) {
    for (var i=0; i<addon.config_vars.length; i++) {
      var cfg_name = addon.config_vars[i].toUpperCase()
      if (cfg_name == filter) {
        return true;
      }
    }
    return false;
  }
    
  function on_response(addons) {
    var redis_addons = [];
    for (var i=0; i < addons.length; i++) {
      var addon = addons[i];
      var service = addon.addon_service.name

      if (service.indexOf(ADDON) == 0 && (!filter || matches(addon))) {
        redis_addons.push(addon)
      }
    }
    return redis_addons
  }

  return on_response
}

module.exports = {
  request: request,
  make_addons_filter: make_addons_filter,
}


