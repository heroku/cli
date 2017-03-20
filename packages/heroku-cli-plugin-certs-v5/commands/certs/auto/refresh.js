'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

function * run (context, heroku) {
  yield cli.action('Refreshing Automatic Certificate Management', heroku.request({
    method: 'PATCH',
    path: `/apps/${context.app}/acm`,
    headers: {'Accept': 'application/vnd.heroku+json; version=3.cedar-acm'},
    body: {acm_refresh: true}
  }))
}

module.exports = {
  topic: 'certs',
  command: 'auto:refresh',
  description: 'Refresh ACM for an app.',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
