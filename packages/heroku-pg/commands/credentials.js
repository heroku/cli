'use strict'

const co = require('co')
const cli = require('heroku-cli-util')
const sortBy = require('lodash.sortby')
const printf = require('printf')

function * run (context, heroku) {
  const fetcher = require('../lib/fetcher')(heroku)

  const {app, args, flags} = context

  let showCredentials = co.wrap(function * () {
    const host = require('../lib/host')
    let addon = yield fetcher.addon(app, args.database)
    let attachments = []

    function formatAttachment (attachment) {
      let attName = cli.color.addon(attachment.name)

      let output = [cli.color.dim('as'), attName]
      let appInfo = `on ${cli.color.app(attachment.app.name)} app`
      output.push(cli.color.dim(appInfo))

      return output.join(' ')
    }

    function renderAttachment (attachment, app, isLast) {
      let line = isLast ? '└─' : '├─'
      let attName = formatAttachment(attachment)
      return printf(' %s %s', cli.color.dim(line), attName)
    }

    function presentCredential (cred) {
      let credAttachments = []
      if (cred !== 'default') {
        credAttachments = attachments.filter(a => a.namespace === `credential:${cred}`)
      } else {
        credAttachments = attachments.filter(a => a.namespace === null)
      }
      let isForeignApp = (attOrAddon) => attOrAddon.app.name !== app
      let atts = sortBy(credAttachments,
        isForeignApp,
        'name',
        'app.name'
      )

      // render each attachment under the credential
      let attLines = atts.map(function (attachment, idx) {
        let isLast = (idx === credAttachments.length - 1)
        return renderAttachment(attachment, app, isLast)
      })

      return [cred].concat(attLines).join('\n')
    }

    try {
      let credentials = yield heroku.get(`/postgres/v0/databases/${addon.name}/credentials`,
                                       { host: host(addon) })
      let isDefaultCredential = (cred) => cred.name !== 'default'
      credentials = sortBy(credentials, isDefaultCredential, 'name')
      attachments = yield heroku.get(`/addons/${addon.name}/addon-attachments`)

      cli.table(credentials, {
        columns: [
          {key: 'name', label: 'Credential', format: presentCredential},
          {key: 'state', label: 'State'}
        ]
      })
    } catch (err) {
      if (!err.statusCode || err.statusCode !== 422) throw err
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
