'use strict'

const co = require('co')
const cli = require('heroku-cli-util')
const sortBy = require('lodash.sortby')
const util = require('../lib/util')

function * run (context, heroku) {
  const fetcher = require('../lib/fetcher')(heroku)

  const {app, args, flags} = context

  let showCredentials = co.wrap(function * () {
    const host = require('../lib/host')
    let addon = yield fetcher.addon(app, args.database)
    let attachments = []
    let credentials = []

    function presentCredential (cred) {
      let credAttachments = []
      if (cred !== 'default') {
        credAttachments = attachments.filter(a => a.namespace === `credential:${cred}`)
      } else {
        credAttachments = attachments.filter(a => a.namespace === null)
      }
      return util.presentCredentialAttachments(app, credAttachments, credentials, cred)
    }

    try {
      credentials = yield heroku.get(`/postgres/v0/databases/${addon.name}/credentials`,
                                       { host: host(addon) })
      let isDefaultCredential = (cred) => cred.name !== 'default'
      credentials = sortBy(credentials, isDefaultCredential, 'name')
      attachments = yield heroku.get(`/addons/${addon.name}/addon-attachments`)

      cli.warn(`${cli.color.cmd('pg:credentials')} has recently changed. Please use ${cli.color.cmd('pg:credentials:url')} for the previous output.`)
      cli.table(credentials, {
        columns: [
          {key: 'name', label: 'Credential', format: presentCredential},
          {key: 'state', label: 'State'}
        ]
      })
    } catch (err) {
      if (!err.statusCode || err.statusCode !== 422) throw err
      cli.warn(`This version of ${cli.color.cmd('pg:credentials')} is being deprecated. Please use ${cli.color.cmd('pg:credentials:url')} instead.`)
      let db = yield fetcher.database(app, args.database)
      cli.log(`Connection info string:
   "dbname=${db.database} host=${db.host} port=${db.port || 5432} user=${db.user} password=${db.password} sslmode=require"
Connection URL:
   ${db.url.href}`)
    }
  })

  let reset = co.wrap(function * () {
    const host = require('../lib/host')
    let db = yield fetcher.addon(app, args.database)
    cli.warn(`${cli.color.cmd('pg:credentials --reset')} is being deprecated. Please use ${cli.color.cmd('pg:credentials:rotate')} instead.`)
    yield cli.action(`Resetting credentials on ${cli.color.addon(db.name)}`, co(function * () {
      yield heroku.post(`/client/v11/databases/${db.id}/credentials_rotation`, {host: host(db)})
    }))
  })

  if (flags.reset) {
    yield reset()
  } else {
    yield showCredentials()
  }
}

module.exports = {
  topic: 'pg',
  command: 'credentials',
  description: 'manage the database credentials',
  needsApp: true,
  needsAuth: true,
  flags: [{name: 'reset', description: 'reset database credentials'}],
  args: [{name: 'database', optional: true}],
  run: cli.command({preauth: true}, co.wrap(run))
}
