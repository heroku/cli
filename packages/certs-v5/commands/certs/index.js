'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let _ = require('lodash')

let endpoints = require('../../lib/endpoints.js').certsAndDomains
let displayTable = require('../../lib/display_table.js')

function * run (context, heroku) {
  let certsAndDomains = yield endpoints(context.app, heroku)

  if (certsAndDomains.certs.length === 0) {
    cli.log(`${cli.color.app(context.app)} has no SSL certificates.\nUse ${cli.color.cmd('heroku certs:add CRT KEY')} to add one.`)
  } else {
    displayTable(_.sortBy(certsAndDomains.certs, 'name'))
  }
}

module.exports = {
  topic: 'certs',
  description: 'list SSL certificates for an app',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
