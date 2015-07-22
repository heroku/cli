'use strict';
var Heroku = require('heroku-client');

const HOST = process.env.HEROKU_REDIS_HOST || "redis-api.heroku.com" ;
const PATH =  "/redis/v0/databases";
const ADDON = process.env.HEROKU_REDIS_ADDON_NAME || "heroku-redis";

function request(context, path, method) {
  return Heroku.request( {
    method: method || "GET",
    path: PATH+"/"+path,
    host: HOST,
    auth: context.auth.username+":"+context.auth.password,
    headers: {
      'Accept': 'application/json',
    },
  });
}

function make_addons_filter(filter) {
  if (filter) {
    filter = filter.toUpperCase();
  }

  function matches (addon) {
    for (var i=0; i<addon.config_vars.length; i++) {
      var cfg_name = addon.config_vars[i].toUpperCase();
      if (cfg_name.indexOf(filter) >= 0) {
        return true;
      }
    }
    return false;
  }

  function on_response(addons) {
    var redis_addons = [];
    for (var i=0; i < addons.length; i++) {
      var addon = addons[i];
      var service = addon.addon_service.name;

      if (service.indexOf(ADDON) === 0 && (!filter || matches(addon))) {
        redis_addons.push(addon);
      }
    }
    return redis_addons;
  }

  return on_response;
}

function make_config_var_filter(filter) {
  if (filter) {
    filter = filter.toUpperCase();
  }

  function on_response(config_vars) {
    var servers = [];

    for (var name in config_vars) {
      if (config_vars.hasOwnProperty(name)) {
        var url = config_vars[name];
        if ((url.indexOf('redis:') === 0) && (!filter || name.indexOf(filter) >= 0)) {
          servers.push({url: url, name: name});
        }
      }
    }
    return servers;
  }

  return on_response;
}

module.exports = {
  request: request,
  make_addons_filter: make_addons_filter,
  make_config_var_filter: make_config_var_filter,
};
