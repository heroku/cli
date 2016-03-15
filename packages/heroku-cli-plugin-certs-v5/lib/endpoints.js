'use strict';

function sslCertsPromise(app, heroku) {
  return heroku.request({
    path: `/apps/${app}/ssl-endpoints`,
    headers: {'Accept': 'application/vnd.heroku+json; version=3.ssl_cert'}
  }).then(function(data) {
    return {certs: data, hasAddon: true};          
  }).catch(function(err) {
    if (err.body && err.body.id === 'ssl_endpoint_addon_required') {
      return {certs: [], hasAddon: false};
    } else {
      throw err;
    }
  });
}

function sniCertsPromise(app, heroku) {
  return heroku.request({
    path: `/apps/${app}/sni-endpoints`,
    headers: {'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert'}
  }).then(function(data) {
    return {certs: data};          
  });
}

function meta(app, t, name) {
  var path, type, variant;
  if (t === 'sni') {
    type = 'SNI';
    path = `/apps/${app}/sni-endpoints`;
    variant = 'sni_ssl_cert';
  } else if (t === 'ssl') {
    type = 'Endpoint';
    path = `/apps/${app}/ssl-endpoints`;
    variant = 'ssl_cert';
  } else {
    throw `Unknown type #{type}`;
  }
  if (name) {
    path = `${path}/${name}`;
  }
  return {path, type, variant};
}

function* endpoints(app, heroku) {
  let all_certs = yield {
    ssl_certs: sslCertsPromise(app, heroku),
    sni_certs: sniCertsPromise(app, heroku)
  };

  all_certs.sni_certs.certs.forEach(function(cert) {
    cert._meta = meta(app, 'sni', cert.name);
  });

  all_certs.ssl_certs.certs.forEach(function(cert) { 
    cert._meta = meta(app, 'ssl', cert.name);
  });

  let certs = all_certs.ssl_certs.certs.concat(all_certs.sni_certs.certs).sort(function(a, b) {
    return a.name < b.name;
  });

  return {all: certs, ssl_certs: all_certs.ssl_certs, sni_certs: all_certs.sni_certs};
}

function* all(app, heroku) {
  let certs = yield endpoints(app, heroku);
  return certs.all;
}

function* hasAddon(app, heroku) {
  let ssl_certs = yield sslCertsPromise(app, heroku);
  return ssl_certs.hasAddon;
}

module.exports = {
  endpoints,
  hasAddon,
  meta,
  all
};
