'use strict'

let cli = require('heroku-cli-util')
let formatDate = require('./format_date.js')
let _ = require('lodash')

function type (f) {
  if (f.cname && f.cname.endsWith('.herokuspace.com')) {
    return 'Private Space App'
  }

  if (f.ssl_cert && f.ssl_cert.acm) {
    return 'ACM'
  }

  switch (f._meta.flag) {
    case 'sni':
      return 'SNI'
    case 'ssl':
      return 'Endpoint'
  }

  throw new Error(`Unexpected flag ${f._meta.flag}`)
}

module.exports = function (certs, domains) {
  let mapped = certs.filter(function (f) { return f.ssl_cert }).map(function (f) {
    return {
      name: f.name,
      cname: f.cname,
      expires_at: f.ssl_cert.expires_at,
      ca_signed: f.ssl_cert['ca_signed?'],
      type: type(f),
      common_names: f.ssl_cert.cert_domains.join(', ')
    }
  })

  let columns = [
    {label: 'Name', key: 'name'}
  ]

  if (_.find(mapped, (row) => row.cname)) {
    columns = columns.concat([{label: 'Endpoint', key: 'cname', format: function (f) { return f || '(Not applicable for SNI)' }}])
  }

  columns = columns.concat([
    {label: 'Common Name(s)', key: 'common_names'},
    {label: 'Expires', key: 'expires_at', format: function (f) { return f ? formatDate(f) : '' }},
    {label: 'Trusted', key: 'ca_signed', format: function (f) { return f === undefined ? '' : (f ? 'True' : 'False') }},
    {label: 'Type', key: 'type'}
  ])

  cli.table(mapped, { columns })
}
