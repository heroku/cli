'use strict'

let cli = require('heroku-cli-util')

async function run(context, heroku) {
  let favorites = await heroku.request({ host: 'particleboard.heroku.com', path: '/favorites?type=app', headers: { Range: '' } })

  if (context.flags.json) {
    cli.styledJSON(favorites)
  } else {
    cli.styledHeader('Favorited Apps')
    for (let f of favorites) cli.log(f.resource_name)
  }
}

module.exports = {
  topic: 'apps',
  command: 'favorites',
  description: 'list favorited apps',
  needsAuth: true,
  flags: [
    { name: 'json', description: 'output in json format' }
  ],
  run: cli.command(run)
}
