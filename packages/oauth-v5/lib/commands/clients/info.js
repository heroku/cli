'use strict'

let cli = require('heroku-cli-util')

async function run(context, heroku) {
  let client = await heroku.get(`/oauth/clients/${context.args.id}`)
  if (context.flags.json) {
    cli.styledJSON(client)
  } else if (context.flags.shell) {
    cli.log(`HEROKU_OAUTH_ID=${client.id}`)
    cli.log(`HEROKU_OAUTH_SECRET=${client.secret}`)
  } else {
    cli.styledHeader(client.name)
    cli.styledObject(client)
  }
}

module.exports = {
  topic: 'clients',
  command: 'info',
  description: 'show details of an oauth client',
  needsAuth: true,
  args: [{name: 'id'}],
  flags: [
    {name: 'json', char: 'j', description: 'output in json format'},
    {name: 'shell', char: 's', description: 'output in shell format'}
  ],
  run: cli.command(run)
}
