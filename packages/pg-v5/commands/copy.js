'use strict'

const util = require('../lib/util')
const cli = require('heroku-cli-util')

async function run(context, heroku) {
  const host = require('../lib/host')
  const pgbackups = require('../lib/pgbackups')(context, heroku)
  const fetcher = require('../lib/fetcher')(heroku)
  const { app, args, flags } = context
  const interval = Math.max(3, parseInt(flags['wait-interval'])) || 3

  const upperCaseConfig = function (config) {
    const output = {}
    for (const key in config) {
      output[key.toUpperCase()] = config[key]
    }
    return output
  }

  let resolve = async function (db) {
    if (db.match(/^postgres:\/\//)) {
      // For the case an input is URL format
      let conn = util.parsePostgresConnectionString(db)
      let host = `${conn.host}:${conn.port}`
      return {
        name: conn.database ? `database ${conn.database} on ${host}` : `database on ${host}`,
        url: db,
        confirm: conn.database || conn.host
      }
    } else {
      // Other case (need to resolve attachment)
      let attachment = await fetcher.attachment(app, db)
      if (!attachment) throw new Error(`${db} not found on ${cli.color.app(app)}`)
      let [addon, config] = await Promise.all([
        heroku.get(`/addons/${attachment.addon.name}`),
        heroku.get(`/apps/${attachment.app.name}/config-vars`)
      ])
      attachment.addon = addon
      config = upperCaseConfig(config) // Upper case config var keys
      return {
        name: attachment.name.replace(/^HEROKU_POSTGRESQL_/, '').replace(/_URL$/, ''),
        url: config[attachment.name.toUpperCase() + '_URL'], // Upper case attachment name
        attachment,
        confirm: app
      }
    }
  }

  // Get source and target from inputs
  // source/target format:
  //  * url: postgres://foo/bar
  //  * config var: DATABASE_URL
  //  * just color: PINK
  //  * addon name: my-heroku-addon-name
  //  * app name + color/config: myapp::ORANGE
  let [source, target] = await Promise.all([resolve(args.source), resolve(args.target)])
  if (source.url === target.url) throw new Error('Cannot copy database onto itself')

  await cli.confirmApp(target.confirm, flags.confirm, `WARNING: Destructive action
This command will remove all data from ${cli.color.yellow(target.name)}
Data from ${cli.color.yellow(source.name)} will then be transferred to ${cli.color.yellow(target.name)}`)

  let copy
  let attachment
  await cli.action(`Starting copy of ${cli.color.yellow(source.name)} to ${cli.color.yellow(target.name)}`, async function () {
    attachment = target.attachment || source.attachment
    if (!attachment) throw new Error('Heroku PostgreSQL database must be source or target')
    copy = await heroku.post(`/client/v11/databases/${attachment.addon.id}/transfers`, {
      body: {
        from_name: source.name,
        from_url: source.url,
        to_name: target.name,
        to_url: target.url
      },
      host: host(attachment.addon)
    })
  }())

  if (source.attachment) {
    let credentials = await heroku.get(`/postgres/v0/databases/${source.attachment.addon.name}/credentials`,
      { host: host(source.attachment.addon) })
    if (credentials.length > 1) {
      cli.action.warn(`pg:copy will only copy your default credential and the data it has access to. Any additional credentials and data that only they can access will not be copied.`)
    }
  }
  await pgbackups.wait('Copying', copy.uuid, interval, flags.verbose, attachment.addon.app.name)
}

module.exports = {
  topic: 'pg',
  command: 'copy',
  needsApp: true,
  needsAuth: true,
  description: 'copy all data from source db to target',
  help: 'at least one of the databases must be a Heroku PostgreSQL DB',
  args: [
    { name: 'source' },
    { name: 'target' }
  ],
  flags: [
    { name: 'wait-interval', hasValue: true },
    { name: 'verbose' },
    { name: 'confirm', hasValue: true }
  ],
  run: cli.command({ preauth: true }, run)
}
