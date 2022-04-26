'use strict'

let cli = require('heroku-cli-util')
let certificateDetails = require('../../../lib/certificate_details.js')
let { waitForCertIssuedOnDomains } = require('../../../lib/domains')
let _ = require('lodash')
let distanceInWordsToNow = require('date-fns/distance_in_words_to_now')

const { default: color } = require('@heroku-cli/color')

function humanize (value) {
  if (!value) {
    return color.yellow('Waiting')
  }
  if (value === 'ok') {
    return color.green('OK')
  }
  if (value === 'failed') {
    return color.red('Failed')
  }
  // Remove the following lines once we address this in cedar-acm
  if (value === 'verified') {
    return color.yellow('In Progress')
  }
  if (value === 'dns-verified') {
    return color.yellow('DNS Verified')
  }
  return value.split('-').map((word) => _.capitalize(word)).join(' ')
}

async function run(context, heroku) {
  let [app, certs, domains] = await Promise.all([
    heroku.request({
      path: `/apps/${context.app}`,
      headers: { 'Accept': 'application/vnd.heroku+json; version=3.cedar-acm' }
    }),
    heroku.request({
      path: `/apps/${context.app}/sni-endpoints`,
      headers: { 'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert' }
    }),
    heroku.request({
      path: `/apps/${context.app}/domains`,
      headers: { 'Accept': 'application/vnd.heroku+json; version=3.cedar-acm' }
    })
  ])

  let message
  if (app.acm) {
    cli.styledHeader(`Automatic Certificate Management is ${cli.color.green('enabled')} on ${context.app}`)

    if (certs.length === 1 && certs[0].ssl_cert.acm) {
      cli.log('')
      certificateDetails(certs[0])
    }

    if (context.flags.wait) {
      try {
        await waitForCertIssuedOnDomains(context, heroku)
      } catch {
        // Ignored, we retry the request one more time and show the results on the table
      }

      // We need to request again to get the updated info for the domains
      domains = await heroku.request({
        path: `/apps/${context.app}/domains`,
        headers: { 'Accept': 'application/vnd.heroku+json; version=3.cedar-acm' }
      })
    }

    domains = domains.filter(domain => domain.kind === 'custom')

    if (domains.length > 0) {
      let columns = [
        { label: 'Domain', key: 'hostname' },
        { label: 'Status', key: 'acm_status', format: humanize }
      ]
      if (domains.find(d => d.acm_status_reason)) {
        columns.push({
          label: 'Reason',
          key: 'acm_status_reason'
        })
      }

      columns.push({
        label: 'Last Updated',
        key: 'updated_at',
        format: distanceInWordsToNow
      })

      cli.log('')
      cli.table(domains, { columns })
    }

    let _ = require('lodash')

    if (domains.length === 0) {
      message = `Add a custom domain to your app by running: ${cli.color.cmd('heroku domains:add <yourdomain.com>')}`
    } else if (_.some(domains, (domain) => domain.acm_status === 'failed')) {
      message = `Some domains failed validation after multiple attempts, retry by running: ${cli.color.cmd('heroku certs:auto:refresh')}`
      message += `\n    See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons`
    } else if (_.some(domains, (domain) => domain.acm_status === 'failing')) {
      message = `Some domains are failing validation, please verify that your DNS matches: ${cli.color.cmd('heroku domains')}`
      message += `\n    See our documentation at https://devcenter.heroku.com/articles/automated-certificate-management#failure-reasons`
    }

    if (message) {
      cli.log('')
      cli.styledHeader(message)
    }
  } else {
    cli.styledHeader(`Automatic Certificate Management is ${cli.color.yellow('disabled')} on ${context.app}`)
  }
}

module.exports = {
  topic: 'certs',
  command: 'auto',
  description: 'show ACM status for an app',
  needsApp: true,
  needsAuth: true,
  flags: [
    { name: 'wait', description: 'watch ACM status and display the status when complete' }
  ],
  run: cli.command(run)
}
