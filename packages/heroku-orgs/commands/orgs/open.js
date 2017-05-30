'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
const {flags} = require('cli-engine-heroku')

function * run (context, heroku) {
  let org = yield heroku.get(`/organizations/${context.org || context.team || context.flags.team}`)
  yield cli.open(`https://dashboard.heroku.com/orgs/${org.name}`)
}

module.exports = {
  topic: 'orgs',
  command: 'open',
  description: 'open the organization interface in a browser window',
  needsAuth: true,
  flags: [
    flags.org({name: 'org', hasValue: true, description: 'org to use', hidden: false, required: true}),
    flags.team({name: 'team', hasValue: true, hidden: true})
  ],
  run: cli.command(co.wrap(run))
}
