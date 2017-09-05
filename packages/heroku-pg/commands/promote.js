'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  const fetcher = require('../lib/fetcher')(heroku)
  const {app, args} = context
  const attachment = yield fetcher.attachment(app, args.database)

  yield cli.action(`Ensuring an alternate alias for existing ${cli.color.configVar('DATABASE_URL')}`, co(function * () {
    // Finds or creates a non-DATABASE attachment for the DB currently
    // attached as DATABASE.
    //
    // If current DATABASE is attached by other names, return one of them.
    // If current DATABASE is only attachment, create a new one and return it.
    // If no current DATABASE, return nil.
    let attachments = yield heroku.get(`/apps/${app}/addon-attachments`)
    let current = attachments.find(a => a.name === 'DATABASE')
    if (!current) return
    if (current.addon.name === attachment.addon.name && current.namespace === attachment.namespace) {
      if (attachment.namespace) {
        throw new Error(`${cli.color.attachment(attachment.name)} is already promoted on ${cli.color.app(app)}`)
      } else {
        throw new Error(`${cli.color.addon(attachment.addon.name)} is already promoted on ${cli.color.app(app)}`)
      }
    }
    let existing = attachments.filter(a => a.addon.id === current.addon.id && a.namespace === current.namespace).find(a => a.name !== 'DATABASE')
    if (existing) return cli.action.done(cli.color.configVar(existing.name + '_URL'))

    // The current add-on occupying the DATABASE attachment has no
    // other attachments. In order to promote this database without
    // error, we can create a secondary attachment, just-in-time.

    let backup = yield heroku.post('/addon-attachments', {
      body: {
        app: {name: app},
        addon: {name: current.addon.name},
        namespace: current.namespace,
        confirm: app
      }
    })
    cli.action.done(cli.color.configVar(backup.name + '_URL'))
  }))

  let promotionMessage
  if (attachment.namespace) {
    promotionMessage = `Promoting ${cli.color.attachment(attachment.name)} to ${cli.color.configVar('DATABASE_URL')} on ${cli.color.app(app)}`
  } else {
    promotionMessage = `Promoting ${cli.color.addon(attachment.addon.name)} to ${cli.color.configVar('DATABASE_URL')} on ${cli.color.app(app)}`
  }

  yield cli.action(promotionMessage, co(function * () {
    yield heroku.post('/addon-attachments', {
      body: {
        name: 'DATABASE',
        app: {name: app},
        addon: {name: attachment.addon.name},
        namespace: attachment.namespace,
        confirm: app
      }
    })
  }))
}

module.exports = {
  topic: 'pg',
  command: 'promote',
  description: 'sets DATABASE as your DATABASE_URL',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database'}],
  run: cli.command({preauth: true}, co.wrap(run))
}
