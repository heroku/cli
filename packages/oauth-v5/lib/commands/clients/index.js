'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  const _ = require('lodash')
  let clients = await heroku.get('/oauth/clients')
  clients = _.sortBy(clients, 'name')

  if (context.flags.json) {
    cli.styledJSON(clients)
  } else if (clients.length === 0) {
    cli.log('No OAuth clients.')
  } else {
    cli.table(clients, {
      printHeader: null,
      columns: [
        {key: 'name', format: name => cli.color.green(name)},
        {key: 'id'},
        {key: 'redirect_uri'},
      ],
    })
  }
}

module.exports = {
  topic: 'clients',
  description: 'list your OAuth clients',
  needsAuth: true,
  flags: [
    {char: 'j', name: 'json', description: 'output in json format'},
  ],
  run: cli.command(run),
}
