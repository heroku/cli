'use strict'

let cli = require('heroku-cli-util')

let openssl = require('../../lib/openssl.js')
let endpoints = require('../../lib/endpoints.js').all

function valueEmpty(value) {
  if (value) {
    return value.length === 0
  }

  return true
}

function getSubject(context) {
  let domain = context.args.domain

  let owner = context.flags.owner
  let country = context.flags.country
  let area = context.flags.area
  let city = context.flags.city

  let subject = context.flags.subject

  if (valueEmpty(subject)) {
    subject = ''
    if (!valueEmpty(country)) {
      subject += `/C=${country}`
    }

    if (!valueEmpty(area)) {
      subject += `/ST=${area}`
    }

    if (!valueEmpty(city)) {
      subject += `/L=${city}`
    }

    if (!valueEmpty(owner)) {
      subject += `/O=${owner}`
    }

    subject += `/CN=${domain}`
  }

  return subject
}

function requiresPrompt(context) {
  if (valueEmpty(context.flags.subject)) {
    let args = [context.flags.owner, context.flags.country, context.flags.area, context.flags.city]
    if (!context.flags.now && args.every(function (v) {
      return valueEmpty(v)
    })) {
      return true
    }
  }

  return false
}

function getCommand(certs, domain) {
  if (certs.find(function (f) {
    return f.ssl_cert.cert_domains.find(function (d) {
      return d === domain
    })
  })) {
    return 'update'
  }

  return 'add'
}

async function run(context, heroku) {
  if (requiresPrompt(context)) {
    context.flags.owner = await cli.prompt('Owner of this certificate')
    context.flags.country = await cli.prompt('Country of owner (two-letter ISO code)')
    context.flags.area = await cli.prompt('State/province/etc. of owner')
    context.flags.city = await cli.prompt('City of owner')
  }

  let subject = getSubject(context)

  let domain = context.args.domain
  let keysize = context.flags.keysize || 2048
  let keyfile = `${domain}.key`

  let certs = await endpoints(context.app, heroku)

  var command = getCommand(certs, domain)

  if (context.flags.selfsigned) {
    let crtfile = `${domain}.crt`

    await openssl.spawn(['req', '-new', '-newkey', `rsa:${keysize}`, '-nodes', '-keyout', keyfile, '-out', crtfile, '-subj', subject, '-x509'])

    cli.console.error('Your key and self-signed certificate have been generated.')
    cli.console.error('Next, run:')
    cli.console.error(`$ heroku certs:${command} ${crtfile} ${keyfile}`)
  } else {
    let csrfile = `${domain}.csr`

    await openssl.spawn(['req', '-new', '-newkey', `rsa:${keysize}`, '-nodes', '-keyout', keyfile, '-out', csrfile, '-subj', subject])

    cli.console.error('Your key and certificate signing request have been generated.')
    cli.console.error(`Submit the CSR in '${csrfile}' to your preferred certificate authority.`)
    cli.console.error("When you've received your certificate, run:")
    cli.console.error(`$ heroku certs:${command} CERTFILE ${keyfile}`)
  }
}

module.exports = {
  topic: 'certs',
  command: 'generate',
  args: [
    {name: 'domain', optional: false},
  ],
  flags: [
    {
      name: 'selfsigned',
      optional: true,
      hasValue: false,
      description: 'generate a self-signed certificate instead of a CSR',
    }, {
      name: 'keysize',
      optional: true,
      hasValue: true,
      description: 'RSA key size in bits (default: 2048)',
    }, {
      name: 'owner',
      optional: true,
      hasValue: true,
      description: 'name of organization certificate belongs to',
    }, {
      name: 'country',
      optional: true,
      hasValue: true,
      description: 'country of owner, as a two-letter ISO country code',
    }, {
      name: 'area',
      optional: true,
      hasValue: true,
      description: 'sub-country area (state, province, etc.) of owner',
    }, {
      name: 'city',
      optional: true,
      hasValue: true,
      description: 'city of owner',
    }, {
      name: 'subject',
      optional: true,
      hasValue: true,
      description: 'specify entire certificate subject',
    }, {
      name: 'now',
      optional: true,
      hasValue: false,
      description: 'do not prompt for any owner information',
    },
  ],
  description: 'generate a key and a CSR or self-signed certificate',
  help: 'Generate a key and certificate signing request (or self-signed certificate)\nfor an app. Prompts for information to put in the certificate unless --now\nis used, or at least one of the --subject, --owner, --country, --area, or\n--city options is specified.',
  examples: '$ heroku certs:generate example.com',
  needsApp: true,
  needsAuth: true,
  run: cli.command(run),
}
