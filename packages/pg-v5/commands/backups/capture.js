'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  const pgbackups = require('../../lib/pgbackups')(context, heroku)
  const fetcher = require('../../lib/fetcher')(heroku)
  const host = require('../../lib/host')

  const {app, args, flags} = context
  const interval = Math.max(3, Number.parseInt(flags['wait-interval'])) || 3
  const db = await fetcher.addon(app, args.database)

  if (flags.snapshot) {
    await cli.action(`Taking snapshot of ${cli.color.addon(db.name)}`, (async function () {
      await heroku.post(`/postgres/v0/databases/${db.id}/snapshots`, {host: host()})
    })())
  } else {
    let dbInfo = await heroku.request({
      host: host(),
      method: 'get',
      path: `/client/v11/databases/${db.id}`,
    }).catch(error => {
      if (error.statusCode !== 404) throw error
      cli.exit(1, `${cli.color.addon(db.name)} is not yet provisioned.\nRun ${cli.color.cmd('heroku addons:wait')} to wait until the db is provisioned.`)
    })
    if (dbInfo) {
      let dbProtected = /On/.test(dbInfo.info.find(attribute => attribute.name === 'Continuous Protection').values[0])
      if (dbProtected) {
        cli.warn('Continuous protection is already enabled for this database. Logical backups of large databases are likely to fail.')
        cli.warn('See https://devcenter.heroku.com/articles/heroku-postgres-data-safety-and-continuous-protection#physical-backups-on-heroku-postgres.')
      }
    }

    let backup
    await cli.action(`Starting backup of ${cli.color.addon(db.name)}`, (async function () {
      backup = await heroku.post(`/client/v11/databases/${db.id}/backups`, {host: host()})
    })())
    cli.log(`
Use Ctrl-C at any time to stop monitoring progress; the backup will continue running.
Use ${cli.color.cmd('heroku pg:backups:info')} to check progress.
Stop a running backup with ${cli.color.cmd('heroku pg:backups:cancel')}.
`)
    if (app !== db.app.name) {
      cli.log(`HINT: You are running this command with a non-billing application.
Use ${cli.color.cmd('heroku pg:backups -a ' + db.app.name)} to check the list of backups.
`)
    }

    await pgbackups.wait(`Backing up ${cli.color.configVar(backup.from_name)} to ${cli.color.cyan(pgbackups.transfer.name(backup))}`, backup.uuid, interval, flags.verbose, db.app.name)
  }
}

module.exports = {
  topic: 'pg',
  command: 'backups:capture',
  description: 'capture a new backup',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  flags: [
    {name: 'wait-interval', hasValue: true},
    {name: 'snapshot', hidden: true},
    {name: 'verbose', char: 'v'},
  ],
  run: cli.command({preauth: true}, run),
}
