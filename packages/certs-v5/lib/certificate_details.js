'use strict'

let cli = require('@heroku/heroku-cli-util')
let formatDate = require('./format_date.js')

module.exports = function (cert, message) {
  let now = new Date()
  let autoRenewsAt = new Date(cert.ssl_cert.expires_at)
  autoRenewsAt.setMonth(autoRenewsAt.getMonth() - 1)

  if (cert.app && cert.app.acm && autoRenewsAt > now) {
    cli.log(`Renewal scheduled for ${cli.color.green(formatDate(autoRenewsAt))}.\n`)
  }

  let logMessage = message || 'Certificate details:'
  cli.log(logMessage)
  let tableObject = {
    'Common Name(s)': cert.ssl_cert.cert_domains,
    'Expires At': formatDate(cert.ssl_cert.expires_at),
    Issuer: cert.ssl_cert.issuer,
    'Starts At': formatDate(cert.ssl_cert.starts_at),
    Subject: cert.ssl_cert.subject,
  }

  if (cert.domains && cert.domains.length > 0) {
    tableObject['Domain(s)'] = cert.domains
  }

  cli.styledObject(tableObject)

  if (cert.ssl_cert['ca_signed?']) {
    cli.log('SSL certificate is verified by a root authority.')
  } else if (cert.ssl_cert.issuer === cert.ssl_cert.subject) {
    cli.log('SSL certificate is self signed.')
  } else {
    cli.log('SSL certificate is not trusted.')
  }
}
