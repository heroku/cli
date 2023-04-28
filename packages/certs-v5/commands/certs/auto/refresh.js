'use strict'

let cli = require('heroku-cli-util')

async function run(context, heroku) {
  await cli.action('Refreshing Automatic Certificate Management', heroku.request({
    method: 'PATCH',
    path: `/apps/${context.app}/acm`,
    headers: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    body: {acm_refresh: true},
  }))
}

module.exports = {
  topic: 'certs',
  command: 'auto:refresh',
  description: 'refresh ACM for an app',
  needsApp: true,
  needsAuth: true,
  run: cli.command(run),
}
