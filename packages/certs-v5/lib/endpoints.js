'use strict'

let checkMultiSniFeature = require('./features.js')

function sslCertsPromise (app, heroku) {
  return heroku.request({
    path: `/apps/${app}/ssl-endpoints`,
    headers: {'Accept': 'application/vnd.heroku+json; version=3.ssl_cert'}
  }).then(function (data) {
    return data
  })
}

function sniCertsPromise (app, heroku) {
  return heroku.request({
    path: `/apps/${app}/sni-endpoints`,
    headers: {'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert'}
  }).catch(function (err) {
    if (err.statusCode === 422 && err.body && err.body.id === 'space_app_not_supported') {
      return []
    }
    throw err
  }).then(function (data) {
    return data
  })
}

function meta (app, t, name) {
  var path, variant
  if (t === 'sni') {
    path = `/apps/${app}/sni-endpoints`
    variant = 'sni_ssl_cert'
  } else if (t === 'ssl') {
    path = `/apps/${app}/ssl-endpoints`
    variant = 'ssl_cert'
  } else {
    throw Error('Unknown type ' + t)
  }
  if (name) {
    path = `${path}/${name}`
  }
  return {path, variant, flag: t}
}

function tagAndSort (app, allCerts) {
  allCerts.sni_certs.forEach(function (cert) {
    cert._meta = meta(app, 'sni', cert.name)
  })

  allCerts.ssl_certs.forEach(function (cert) {
    cert._meta = meta(app, 'ssl', cert.name)
  })

  return allCerts.ssl_certs.concat(allCerts.sni_certs).sort(function (a, b) {
    return a.name < b.name
  })
}

function * all (app, heroku) {
  const featureList = yield heroku.get(`/apps/${app}/features`)
  const multipleSniEndpointFeatureEnabled = checkMultiSniFeature(featureList)

  let allCerts;

  if (multipleSniEndpointFeatureEnabled) {
    // use SNI endpoints only
    allCerts = yield {
      ssl_certs: [],
      sni_certs: sniCertsPromise(app, heroku),
    }
  } else {
    allCerts = yield {
      ssl_certs: sslCertsPromise(app, heroku),
      sni_certs: sniCertsPromise(app, heroku)
    }
  }

  return tagAndSort(app, allCerts)
}

function * hasAddon (app, heroku) {
  return yield heroku.request({
    path: `/apps/${app}/addons/ssl%3Aendpoint`
  }).then(function () {
    return true
  }).catch(function (err) {
    if (err.statusCode === 404 && err.body && err.body.id === 'not_found' && err.body.resource === 'addon') {
      return false
    } else {
      throw err
    }
  })
}

function * hasSpace (app, heroku) {
  return yield heroku.request({
    path: `/apps/${app}`
  }).then(function (data) {
    return !!data.space
  })
}

module.exports = {
  hasSpace,
  hasAddon,
  meta,
  all
}
