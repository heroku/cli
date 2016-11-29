'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

let endpoints = require('../../lib/endpoints.js').certsAndDomains
let displayTable = require('../../lib/display_table.js')

function * run (context, heroku) {
  let certsAndDomains = yield endpoints(context.app, heroku)

  if (certsAndDomains.certs.length === 0) {
    cli.log(`${cli.color.app(context.app)} has no SSL certificates.\nUse ${cli.color.cmd('heroku certs:add CRT KEY')} to add one.`)
  } else {
    displayTable(certsAndDomains.certs, certsAndDomains.domains)
  }
}

module.exports = {
  topic: 'certs',
  description: 'List SSL certificates for an app.',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
