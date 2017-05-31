'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
const {flags} = require('cli-engine-heroku')

function * run (context, heroku) {
  let team = context.org || context.team || context.flags.team
  if (!team) throw new Error('No organization specified')
  let org = yield heroku.get(`/organizations/${team}`)
  yield cli.open(`https://dashboard.heroku.com/orgs/${org.name}`)
}

module.exports = {
  topic: 'orgs',
  command: 'open',
  description: 'open the organization interface in a browser window',
  needsAuth: true,
  wantsOrg: true,
  flags: [
    // flags.org({name: 'org', hasValue: true, description: 'org to use', hidden: false}),
    flags.team({name: 'team', hasValue: true, hidden: true})
  ],
  run: cli.command(co.wrap(run))
}
