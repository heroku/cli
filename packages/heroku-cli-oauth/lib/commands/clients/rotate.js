'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let id = context.args.id

  cli.log(`Updating ${cli.color.cyan(id)}`)

  let client = yield heroku.request({
    method: 'POST',
    path: `/oauth/clients/${encodeURIComponent(id)}/actions/rotate-credentials`
  })

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
  command: 'rotate',
  description: 'rotate OAuth client secret',
  args: [{name: 'id'}],
  flags: [
    {name: 'json', char: 'j', description: 'output in json format'},
    {name: 'shell', char: 's', description: 'output in shell format'}
  ],
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
