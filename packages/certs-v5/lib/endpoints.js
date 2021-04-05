'use strict'

const { checkPrivateSniFeature } = require('./features.js')

function sslCertsPromise (app, heroku) {
  return heroku.request({
    path: `/apps/${app}/ssl-endpoints`,
    headers: {'Accept': 'application/vnd.heroku+json; version=3.ssl_cert'}
  }).then(function (data) {
    return data
  })
}

function sniCertsPromise (app, heroku) {
  return heroku.request({path: `/apps/${app}/sni-endpoints`}).catch(function (err) {
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
  } else if (t === 'ssl') {
    path = `/apps/${app}/ssl-endpoints`
    variant = 'ssl_cert'
  } else {
    throw Error('Unknown type ' + t)
  }
  if (name) {
    path = `${path}/${name}`
  }

  if (variant) {
    return {path, variant, flag: t}
  } else {
    return {path, flag: t}
  }
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

async function all(appName, heroku) {
  const featureList = await heroku.get(`/apps/${appName}/features`)
  const privateSniFeatureEnabled = checkPrivateSniFeature(featureList)

  let [ssl_certs, sni_certs] = await Promise.all([
    // use SNI endpoints only
    privateSniFeatureEnabled ? [] : sslCertsPromise(appName, heroku),
    sniCertsPromise(appName, heroku)
  ])

  let allCerts = {
    ssl_certs,
    sni_certs
  }

  return tagAndSort(appName, allCerts)
}

async function hasAddon(app, heroku) {
  return await heroku.request({
    path: `/apps/${app}/addons/ssl%3Aendpoint`
  }).then(function () {
    return true
  }).catch(function (err) {
    if (err.statusCode === 404 && err.body && err.body.id === 'not_found' && err.body.resource === 'addon') {
      return false
    } else {
      throw err
    }
  });
}

async function hasSpace(app, heroku) {
  return await heroku.request({
    path: `/apps/${app}`
  }).then(function (data) {
    return !!data.space
  });
}

module.exports = {
  hasSpace,
  hasAddon,
  meta,
  all
}
