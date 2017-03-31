'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context, heroku) {
  const url = require('url')
  const util = require('../lib/util')
  const host = require('../lib/host')
  const pgbackups = require('../lib/pgbackups')(context, heroku)
  const fetcher = require('../lib/fetcher')(heroku)
  const {app, args, flags} = context
  const interval = Math.max(3, parseInt(flags['wait-interval'])) || 3

  let resolve = co.wrap(function * (db) {
    if (db.match(/^postgres:\/\//)) {
      let uri = url.parse(db)
      let name = uri.path ? uri.path.slice(1) : ''
      let hostname = `${uri.host}:${uri.port || 5432}`
      return {
        name: name ? `database ${name} on ${hostname}` : `database on ${hostname}`,
        url: db,
        confirm: name || uri.host
      }
    } else {
      let attachment = yield fetcher.attachment(app, db)
      if (!attachment) throw new Error(`${db} not found on ${cli.color.app(app)}`)
      let [addon, config] = yield [
        heroku.get(`/addons/${attachment.addon.name}`),
        heroku.get(`/apps/${attachment.addon.app.name}/config-vars`)
      ]
      attachment.addon = addon
      return {
        name: attachment.name.replace(/^HEROKU_POSTGRESQL_/, '').replace(/_URL$/, ''),
        url: config[util.getUrl(addon.config_vars)],
        attachment,
        confirm: app
      }
    }
  })

  let [source, target] = yield [resolve(args.source), resolve(args.target)]
  if (source.url === target.url) throw new Error('Cannot copy database onto itself')

  yield cli.confirmApp(target.confirm, flags.confirm, `WARNING: Destructive action
This command will remove all data from ${cli.color.yellow(target.name)}
Data from ${cli.color.yellow(source.name)} will then be transferred to ${cli.color.yellow(target.name)}`)

  let copy
  let attachment
  yield cli.action(`Starting copy of ${cli.color.yellow(source.name)} to ${cli.color.yellow(target.name)}`, co(function * () {
    attachment = target.attachment || source.attachment
    if (!attachment) throw new Error('Heroku PostgreSQL database must be source or target')
    copy = yield heroku.post(`/client/v11/databases/${attachment.addon.id}/transfers`, {
      body: {
        from_name: source.name,
        from_url: source.url,
        to_name: target.name,
        to_url: target.url
      },
      host: host(attachment.addon)
    })
  }))
  yield pgbackups.wait('Copying', copy.uuid, interval, flags.verbose, attachment.addon.app.name)
}

module.exports = {
  topic: 'pg',
  command: 'copy',
  needsApp: true,
  needsAuth: true,
  description: 'copy all data from source db to target',
  help: 'at least one of the databases must be a Heroku PostgreSQL DB',
  args: [
    {name: 'source'},
    {name: 'target'}
  ],
  flags: [
    {name: 'wait-interval', hasValue: true},
    {name: 'verbose'},
    {name: 'confirm', hasValue: true}
  ],
  run: cli.command({preauth: true}, co.wrap(run))
}
