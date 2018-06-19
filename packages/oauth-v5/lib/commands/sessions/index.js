'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context, heroku) {
  const _ = require('lodash')
  let sessions = yield heroku.get('/oauth/sessions')
  sessions = _.sortBy(sessions, 'description')

  if (context.flags.json) {
    cli.styledJSON(sessions)
  } else if (sessions.length === 0) {
    cli.log('No OAuth sessions.')
  } else {
    cli.table(sessions, {
      printHeader: null,
      columns: [
        {key: 'description', format: name => cli.color.green(name)},
        {key: 'id'}
      ]
    })
  }
}

module.exports = {
  topic: 'sessions',
  description: 'list your OAuth sessions',
  needsAuth: true,
  flags: [
    {char: 'j', name: 'json', description: 'output in json format'}
  ],
  run: cli.command(co.wrap(run))
}
