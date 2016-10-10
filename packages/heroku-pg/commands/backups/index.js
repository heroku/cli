'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context, heroku) {
  if (context.args.length > 0) {
    // backwards compatible for executing commands like
    // `heroku pg:backups info` instead of `heroku pg:backups:info`
    const {spawnSync} = require('child_process')
    let args = context.args.slice()
    args[0] = `pg:backups:${args[0]}`
    let {status} = spawnSync('heroku', args, {env: process.env, stdio: 'inherit'})
    process.exit(status)
  }

  const pgbackups = require('../../lib/pgbackups')(context, heroku)
  const sortBy = require('lodash.sortby')
  const host = require('../../lib/host')()
  const app = context.app

  function displayBackups (backups) {
    cli.styledHeader('Backups')
    if (!backups.length) {
      cli.log(`No backups. Capture one with ${cli.color.cmd('heroku pg:backups:capture')}`)
    } else {
      cli.table(backups, {
        columns: [
          {label: 'ID', format: (_, t) => cli.color.cyan(pgbackups.transfer.name(t))},
          {label: 'Created at', key: 'created_at'},
          {label: 'Status', format: (_, t) => pgbackups.transfer.status(t)},
          {label: 'Size', key: 'processed_bytes', format: b => pgbackups.filesize(b)},
          {label: 'Database', key: 'from_name', format: d => cli.color.configVar(d) || 'UNKNOWN'}
        ]
      })
    }
    cli.log()
  }

  function displayRestores (restores) {
    cli.styledHeader('Restores')
    restores = restores.slice(0, 10)
    if (!restores.length) {
      cli.log(`No restores found. Use ${cli.color.cmd('heroku pg:backups:restore')} to restore a backup`)
    } else {
      cli.table(restores, {
        columns: [
          {label: 'ID', format: (_, t) => cli.color.cyan(pgbackups.transfer.name(t))},
          {label: 'Started at', key: 'created_at'},
          {label: 'Status', format: (_, t) => pgbackups.transfer.status(t)},
          {label: 'Size', key: 'processed_bytes', format: b => pgbackups.filesize(b)},
          {label: 'Database', key: 'to_name', format: d => cli.color.configVar(d) || 'UNKNOWN'}
        ]
      })
    }
    cli.log()
  }

  function displayCopies (copies) {
    cli.styledHeader('Copies')
    copies = copies.slice(0, 10)
    if (!copies.length) {
      cli.log(`No copies found. Use ${cli.color.cmd('heroku pg:copy')} to copy a database to another`)
    } else {
      cli.table(copies, {
        columns: [
          {label: 'ID', format: (_, t) => cli.color.cyan(pgbackups.transfer.name(t))},
          {label: 'Started at', key: 'created_at'},
          {label: 'Status', format: (_, t) => pgbackups.transfer.status(t)},
          {label: 'Size', key: 'processed_bytes', format: b => pgbackups.filesize(b)},
          {label: 'From', key: 'from_name', format: d => cli.color.configVar(d) || 'UNKNOWN'},
          {label: 'To', key: 'to_name', format: d => cli.color.configVar(d) || 'UNKNOWN'}
        ]
      })
    }
    cli.log()
  }

  let transfers = yield heroku.get(`/client/v11/apps/${app}/transfers`, {host})
  transfers = sortBy(transfers, 'created_at').reverse()

  let backups = transfers.filter(t => t.from_type === 'pg_dump' && t.to_type === 'gof3r')
  let restores = transfers.filter(t => t.from_type !== 'pg_dump' && t.to_type === 'pg_restore')
  let copies = transfers.filter(t => t.from_type === 'pg_dump' && t.to_type === 'pg_restore')

  displayBackups(backups)
  displayRestores(restores)
  displayCopies(copies)
}

module.exports = {
  topic: 'pg',
  command: 'backups',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command({preauth: true}, co.wrap(run))
}
