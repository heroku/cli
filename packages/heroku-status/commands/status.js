'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function capitalize (str) {
  return str.substr(0, 1).toUpperCase() + str.substr(1)
}

function printStatus (status) {
  var message = capitalize(status)
  var colorize = cli.color[status]

  if (status === 'green') {
    message = 'No known issues at this time.'
  }
  return colorize(message)
}

function * run (context) {
  const moment = require('moment')
  const maxBy = require('lodash.maxby')
  const padEnd = require('lodash.padend')

  let host = process.env.HEROKU_STATUS_HOST || 'https://status.heroku.com'
  let response = (yield cli.got(host + '/api/v3/current-status', {
    path: '/api/v3/current-status',
    json: true,
    headers: { 'Accept': 'application/vnd.heroku+json;' }
  })).body

  if (context.flags.json) {
    cli.styledJSON(response)
    return
  }

  cli.log(`Production:   ${printStatus(response.status.Production)}`)
  cli.log(`Development:  ${printStatus(response.status.Development)}`)

  response.issues.forEach(function (incident) {
    cli.log()
    cli.styledHeader(`${incident.title} ${cli.color.yellow(moment(incident.created_at).format('LT'))} ${cli.color.cyan(incident.full_url)}`)

    let padding = maxBy(incident.updates, 'update_type.length').update_type.length + 1
    incident.updates.forEach((u) => {
      cli.log(`${cli.color.yellow(padEnd(u.update_type, padding))} ${moment(u.updated_at).format('LT')} (${moment(u.updated_at).fromNow()})`)
      cli.log(`${u.contents}
`)
    })
  })
}

module.exports = {
  topic: 'status',
  description: 'display current status of Heroku platform',
  flags: [
    {name: 'json', description: 'output in json format'}
  ],
  run: cli.command(co.wrap(run))
}
