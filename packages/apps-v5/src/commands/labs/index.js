'use strict'

const cli = require('@heroku/heroku-cli-util')

function printJSON(features) {
  cli.log(JSON.stringify(features, null, 2))
}

function printFeatures(features) {
  const {sortBy} = require('lodash')

  features = sortBy(features, 'name')
  let longest = Math.max.apply(null, features.map(f => f.name.length))
  for (let f of features) {
    let line = `${f.enabled ? '[+]' : '[ ]'} ${f.name.padEnd(longest)}`
    if (f.enabled) line = cli.color.green(line)
    line = `${line}  ${f.description}`
    cli.log(line)
  }
}

async function run(context, heroku) {
  let [currentUser, user, app] = await Promise.all([
    heroku.get('/account'),
    heroku.get('/account/features'),
    context.app ? heroku.get(`/apps/${context.app}/features`) : null,
  ])

  let features = {
    currentUser,
    user,
    app,
  }
  // general features are managed via `features` not `labs`
  features.user = features.user.filter(f => f.state !== 'general')
  if (features.app) features.app = features.app.filter(f => f.state !== 'general')
  if (context.flags.json) {
    delete features.currentUser
    printJSON(features)
  } else {
    cli.styledHeader(`User Features ${cli.color.cyan(features.currentUser.email)}`)
    printFeatures(features.user)
    if (features.app) {
      cli.log()
      cli.styledHeader(`App Features ${cli.color.app(context.app)}`)
      printFeatures(features.app)
    }
  }
}

module.exports = {
  topic: 'labs',
  description: 'list experimental features',
  flags: [
    {name: 'json', description: 'display as json'},
  ],
  needsAuth: true,
  wantsApp: true,
  run: cli.command(run),
}
