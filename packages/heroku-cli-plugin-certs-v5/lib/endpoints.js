'use strict';

function sslCertsPromise(app, heroku) {
  return heroku.request({
    path: `/apps/${app}/ssl-endpoints`,
    headers: {'Accept': 'application/vnd.heroku+json; version=3.ssl_cert'}
  }).then(function(data) {
    return data;
  });
}

function sniCertsPromise(app, heroku) {
  return heroku.request({
    path: `/apps/${app}/sni-endpoints`,
    headers: {'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert'}
  }).then(function(data) {
    return data;          
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

function tagAndSort(app, all_certs) {
  all_certs.sni_certs.forEach(function(cert) {
    cert._meta = meta(app, 'sni', cert.name);
  });

  all_certs.ssl_certs.forEach(function(cert) { 
    cert._meta = meta(app, 'ssl', cert.name);
  });

  return all_certs.ssl_certs.concat(all_certs.sni_certs).sort(function(a, b) {
    return a.name < b.name;
  });
}

function* all(app, heroku) {
  let all_certs = yield {
    ssl_certs: sslCertsPromise(app, heroku),
    sni_certs: sniCertsPromise(app, heroku)
  };

  return tagAndSort(app, all_certs);
}

function* certsAndDomains(app, heroku) {
  let requests = yield {
    ssl_certs: sslCertsPromise(app, heroku),
    sni_certs: sniCertsPromise(app, heroku),
    domains: heroku.request({path: `/apps/${app}/domains`})
  };

  return {certs: tagAndSort(app, requests), domains: requests.domains};
}

function* hasAddon(app, heroku) {
  return yield heroku.request({
    path: `/apps/${app}/addons/ssl%3Aendpoint`,
  }).then(function() {
    return true;
  }).catch(function(err) {
    if (err.statusCode === 404 && err.body && err.body.id === 'not_found' && err.body.resource === 'addon') {
      return false;
    } else {
      throw err;
    }
  });
}

module.exports = {
  hasAddon,
  meta,
  all,
  certsAndDomains
};
