'use strict'

let cli = require('heroku-cli-util')
let _ = require('lodash')
let inquirer = require('inquirer')
let endpoints = require('../../lib/endpoints.js')
let displayWarnings = require('../../lib/display_warnings.js')
let certificateDetails = require('../../lib/certificate_details.js')
let getCertAndKey = require('../../lib/get_cert_and_key.js')
let matchDomains = require('../../lib/match_domains.js')
let {waitForDomains} = require('../../lib/domains')

async function getMeta(context) {
  return endpoints.meta(context.app, 'sni')
}

async function configureDomains(context, heroku, meta, cert) {
  let certDomains = cert.ssl_cert.cert_domains
  let apiDomains = await waitForDomains(context, heroku)
  let appDomains = apiDomains.map(domain => domain.hostname)
  let matchedDomains = matchDomains(certDomains, appDomains)

  if (matchedDomains.length > 0) {
    cli.styledHeader('Almost done! Which of these domains on this application would you like this certificate associated with?')

    let selectedDomains = ((await inquirer.prompt([{
      type: 'checkbox',
      name: 'domains',
      message: 'Select domains',
      choices: matchedDomains,
    }]))).domains

    if (selectedDomains.length > 0) {
      await Promise.all(selectedDomains.map(domain => {
        return heroku.request({
          method: 'PATCH',
          path: `/apps/${context.app}/domains/${domain}`,
          body: {sni_endpoint: cert.name},
        })
      }))
    }
  }
}

async function run(context, heroku) {
  let meta = await getMeta(context, heroku)

  let files = await getCertAndKey(context)

  let cert = await cli.action(`Adding SSL certificate to ${cli.color.app(context.app)}`, {}, heroku.request({
    path: meta.path,
    method: 'POST',
    body: {certificate_chain: files.crt, private_key: files.key},
    headers: {Accept: `application/vnd.heroku+json; version=3${meta.variant ? '.' + meta.variant : ''}`},
  }))

  cert._meta = meta

  // Remove the warning for SNI endpoints because we will provide our own error
  if (cert.warnings && cert.warnings.ssl_cert) {
    _.pull(cert.warnings.ssl_cert, 'provides no domain(s) that are configured for this Heroku app')
  }

  if (meta.flag !== 'sni' || cert.cname) {
    cli.log(`${cli.color.app(context.app)} now served by ${cli.color.green(cert.cname)}`)
  }

  certificateDetails(cert)

  await configureDomains(context, heroku, meta, cert)
  displayWarnings(cert)
}

module.exports = {
  topic: 'certs',
  command: 'add',
  variableArgs: true,
  args: [
    {name: 'CRT', optional: false},
    {name: 'KEY', optional: false},
  ],
  flags: [
    {name: 'bypass', description: 'bypass the trust chain completion step', hasValue: false},
  ],
  description: 'add an SSL certificate to an app',
  help: 'Note: certificates with PEM encoding are also valid',
  examples: `$ heroku certs:add example.com.crt example.com.key

    If you require intermediate certificates, refer to this article on merging certificates to get a complete chain:
    https://help.salesforce.com/s/articleView?id=000333504&type=1`,
  needsApp: true,
  needsAuth: true,
  run: cli.command(run),
}
