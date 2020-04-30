'use strict'

const cli = require('heroku-cli-util')
const co = require('co')
const host = require('../lib/host')

function * run (context, heroku) {
  const fetcher = require('../lib/fetcher')(heroku)
  const { app, args, flags } = context
  const { force } = flags
  const attachment = yield fetcher.attachment(app, args.database)

  let current

  yield cli.action(`Ensuring an alternate alias for existing ${cli.color.configVar('DATABASE_URL')}`, co(function * () {
    // Finds or creates a non-DATABASE attachment for the DB currently
    // attached as DATABASE.
    //
    // If current DATABASE is attached by other names, return one of them.
    // If current DATABASE is only attachment, create a new one and return it.
    // If no current DATABASE, return nil.
    let attachments = yield heroku.get(`/apps/${app}/addon-attachments`)
    current = attachments.find(a => a.name === 'DATABASE')
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
        app: { name: app },
        addon: { name: current.addon.name },
        namespace: current.namespace,
        confirm: app
      }
    })
    cli.action.done(cli.color.configVar(backup.name + '_URL'))
  }))

  if (!force) {
    let status = yield heroku.request({
      host: host(attachment.addon),
      path: `/client/v11/databases/${attachment.addon.id}/wait_status`
    })

    if (status['waiting?']) {
      throw new Error(`Database cannot be promoted while in state: ${status['message']}
\nPromoting this database can lead to application errors and outage. Please run pg:wait to wait for database to become available.
\nTo ignore this error, you can pass the --force flag to promote the database and risk application issues.`)
    }
  }

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
        app: { name: app },
        addon: { name: attachment.addon.name },
        namespace: attachment.namespace,
        confirm: app
      }
    })
  }))

  let releasePhase = (yield heroku.get(`/apps/${app}/formation`))
    .find((formation) => formation.type === 'release')

  if (releasePhase) {
    yield cli.action('Checking release phase', co(function * () {
      let releases = yield heroku.request({
        path: `/apps/${app}/releases`,
        partial: true,
        headers: {
          'Range': `version ..; max=5, order=desc`
        }
      })
      let attach = releases.find((release) => release.description.includes('Attach DATABASE'))
      let detach = releases.find((release) => release.description.includes('Detach DATABASE'))

      if (!attach || !detach) {
        throw new Error('Unable to check release phase. Check your Attach DATABASE release for failures.')
      }

      let endTime = Date.now() + 900000 // 15 minutes from now
      let [attachId, detachId] = [attach.id, detach.id]
      while (true) {
        let attach = yield fetcher.release(app, attachId)
        if (attach && attach.status === 'succeeded') {
          let msg = 'pg:promote succeeded.'
          let detach = yield fetcher.release(app, detachId)
          if (detach && detach.status === 'failed') {
            msg += ` It is safe to ignore the failed ${detach.description} release.`
          }
          return cli.action.done(msg)
        } else if (attach && attach.status === 'failed') {
          let msg = `pg:promote failed because ${attach.description} release was unsuccessful. Your application is currently running `
          let detach = yield fetcher.release(app, detachId)
          if (detach && detach.status === 'succeeded') {
            msg += 'without an attached DATABASE_URL.'
          } else {
            msg += `with ${current.addon.name} attached as DATABASE_URL.`
          }
          msg += ' Check your release phase logs for failure causes.'
          return cli.action.done(msg)
        } else if (Date.now() > endTime) {
          return cli.action.done('timeout. Check your Attach DATABASE release for failures.')
        }

        yield new Promise((resolve) => setTimeout(resolve, 5000))
      }
    }))
  }
}

module.exports = {
  topic: 'pg',
  command: 'promote',
  description: 'sets DATABASE as your DATABASE_URL',
  needsApp: true,
  needsAuth: true,
  flags: [{ name: 'force', char: 'f' }],
  args: [{ name: 'database' }],
  run: cli.command({ preauth: true }, co.wrap(run))
}
