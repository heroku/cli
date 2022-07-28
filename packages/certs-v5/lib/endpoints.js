'use strict'

function sniCertsPromise (app, heroku) {
  return heroku.request({path: `/apps/${app}/sni-endpoints`}).then(function (data) {
    return data
  })
}

function meta (app, t, name) {
  var path
  if (t === 'sni') {
    path = `/apps/${app}/sni-endpoints`
  } else {
    throw Error('Unknown type ' + t)
  }
  if (name) {
    path = `${path}/${name}`
  }

  return {path, flag: t}
}

function tagAndSort (app, sniCerts) {
  sniCerts.forEach(function (cert) {
    cert._meta = meta(app, 'sni', cert.name)
  })

  return sniCerts.sort(function (a, b) {
    return a.name < b.name
  })
}

async function all(appName, heroku) {
  let sniCerts = await sniCertsPromise(appName, heroku)

  return tagAndSort(appName, sniCerts)
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
  meta,
  all
}
