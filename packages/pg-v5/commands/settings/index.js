'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  const host = require('../../lib/host')
  const util = require('../../lib/util')
  const fetcher = require('../../lib/fetcher')(heroku)
  const {app, args} = context

  const db = await fetcher.addon(app, args.database)

  if (util.essentialPlan(db)) throw new Error('You can’t perform this operation on Essential-tier databases.')

  let settings = await heroku.get(`/postgres/v0/databases/${db.id}/config`, {host: host(db)})
  cli.styledHeader(db.name)
  let remapped = Object.keys(settings).reduce((s, key) => {
    s[key.replace(/_/g, '-')] = settings[key].value
    return s
  }, {})
  cli.styledObject(remapped)
}

module.exports = {
  topic: 'pg',
  command: 'settings',
  description: 'show your current database settings',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  run: cli.command({preauth: true}, run),
}
