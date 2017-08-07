'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context, heroku) {
  const host = require('../../lib/host')
  const fetcher = require('../../lib/fetcher')(heroku)
  const util = require('../../lib/util')
  const {app, args, flags} = context
  let db = yield fetcher.addon(app, args.database)
  let all = flags.all

  if (all && flags.name !== undefined) {
    throw new Error('cannot pass both --all and --name')
  }
  let cred = flags.name || 'default'
  if ((cred === 'default' || all) && flags.force) {
    if (all) {
      throw new Error('Cannot force rotate all credentials: the default credential cannot be force rotated.')
    } else {
      throw new Error('Cannot force rotate the default credential.')
    }
  }
  if (util.starterPlan(db) && cred !== 'default') {
    throw new Error(`Only one default credential is supported for Hobby tier databases.`)
  }
  let attachments = yield heroku.get(`/addons/${db.name}/addon-attachments`)
  if (flags.name) {
    attachments = attachments.filter(a => a.namespace === `credential:${cred}`)
  }

  let warnings = []
  if (!flags.all) {
    warnings.push(`The password for the ${cred} credential will rotate.`)
  }
  if (flags.all || flags.force || cred === 'default') {
    warnings.push(`Connections will be reset and applications will be restarted.`)
  } else {
    warnings.push(`Connections older than 30 minutes will be reset, and a temporary rotation username will be used during the process.`)
  }
  if (attachments.length > 0) {
    warnings.push(`This command will affect the app${(attachments.length > 1) ? 's' : ''} ${[...new Set(attachments.map(c => cli.color.app(c.app.name)))].sort().join(', ')}.`)
  }

  yield cli.confirmApp(app, flags.confirm, `WARNING: Destructive Action
${warnings.join('\n')}`)

  let body = flags.force ? {host: host(db), force: true} : {host: host(db)}

  if (all) {
    yield cli.action(`Rotating all credentials on ${cli.color.addon(db.name)}`, co(function * () {
      yield heroku.post(`/postgres/v0/databases/${db.name}/credentials_rotation`,
                        body)
    }))
  } else {
    yield cli.action(`Rotating ${cred} on ${cli.color.addon(db.name)}`, co(function * () {
      yield heroku.post(`/postgres/v0/databases/${db.name}/credentials/${encodeURIComponent(cred)}/credentials_rotation`,
                        body)
    }))
  }
}

module.exports = {
  topic: 'pg',
  command: 'credentials:rotate',
  description: 'rotate the database credentials',
  needsApp: true,
  needsAuth: true,
  flags: [
    {name: 'name', char: 'n', description: 'which credential to rotate (default credentials if not specified)', hasValue: true},
    {name: 'all', description: 'rotate all credentials', hasValue: false},
    {name: 'confirm', char: 'c', hasValue: true},
    {name: 'force', description: 'forces rotating the targeted credentials', hasValue: false}
  ],
  args: [{name: 'database', optional: true}],
  run: cli.command({preauth: true}, co.wrap(run))
}
