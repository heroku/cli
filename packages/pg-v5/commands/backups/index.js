'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  if (context.args.length > 0) {
    // backwards compatible for executing commands like
    // `heroku pg:backups info` instead of `heroku pg:backups:info`
    let pgbackupCommand = `backups:${context.args[0]}`

    const commands = require('../..').commands
    const cmd = commands.find(c => c.topic === 'pg' && c.command === pgbackupCommand)

    if (!cmd) {
      throw new Error(`Unknown pg:backups command: ${context.args[0]}`)
    }

    let args = {}
    context.args.slice(1).forEach(function (arg, index) {
      if (cmd.args[index]) {
        args[cmd.args[index].name] = arg
      } else {
        throw new Error(`Unexpected argument: ${arg}`)
      }
    })

    context = Object.assign(context, {args})

    await cmd.run(context, heroku)
  } else {
    await list(context, heroku)
  }
}

async function list(context, heroku) {
  const pgbackups = require('../../lib/pgbackups')(context, heroku)
  const {sortBy} = require('lodash')
  const host = require('../../lib/host')()
  const app = context.app

  function displayBackups(backups) {
    cli.styledHeader('Backups')
    if (backups.length === 0) {
      cli.log(`No backups. Capture one with ${cli.color.cmd('heroku pg:backups:capture')}`)
    } else {
      cli.table(backups, {
        columns: [
          {label: 'ID', format: (_, t) => cli.color.cyan(pgbackups.transfer.name(t))},
          {label: 'Created at', key: 'created_at'},
          {label: 'Status', format: (_, t) => pgbackups.transfer.status(t)},
          {label: 'Size', key: 'processed_bytes', format: b => pgbackups.filesize(b)},
          {label: 'Database', key: 'from_name', format: d => cli.color.configVar(d) || 'UNKNOWN'},
        ],
      })
    }

    cli.log()
  }

  function displayRestores(restores) {
    cli.styledHeader('Restores')
    restores = restores.slice(0, 10)
    if (restores.length === 0) {
      cli.log(`No restores found. Use ${cli.color.cmd('heroku pg:backups:restore')} to restore a backup`)
    } else {
      cli.table(restores, {
        columns: [
          {label: 'ID', format: (_, t) => cli.color.cyan(pgbackups.transfer.name(t))},
          {label: 'Started at', key: 'created_at'},
          {label: 'Status', format: (_, t) => pgbackups.transfer.status(t)},
          {label: 'Size', key: 'processed_bytes', format: b => pgbackups.filesize(b)},
          {label: 'Database', key: 'to_name', format: d => cli.color.configVar(d) || 'UNKNOWN'},
        ],
      })
    }

    cli.log()
  }

  function displayCopies(copies) {
    cli.styledHeader('Copies')
    copies = copies.slice(0, 10)
    if (copies.length === 0) {
      cli.log(`No copies found. Use ${cli.color.cmd('heroku pg:copy')} to copy a database to another`)
    } else {
      cli.table(copies, {
        columns: [
          {label: 'ID', format: (_, t) => cli.color.cyan(pgbackups.transfer.name(t))},
          {label: 'Started at', key: 'created_at'},
          {label: 'Status', format: (_, t) => pgbackups.transfer.status(t)},
          {label: 'Size', key: 'processed_bytes', format: b => pgbackups.filesize(b)},
          {label: 'From', key: 'from_name', format: d => cli.color.configVar(d) || 'UNKNOWN'},
          {label: 'To', key: 'to_name', format: d => cli.color.configVar(d) || 'UNKNOWN'},
        ],
      })
    }

    cli.log()
  }

  let transfers = await heroku.get(`/client/v11/apps/${app}/transfers`, {host})
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
  description: 'list database backups',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  flags: [
    // for backwards compatibility with `pg:backups command` invocation
    {name: 'verbose', char: 'v', hidden: true},
    {name: 'confirm', char: 'c', hasValue: true, hidden: true},
    {name: 'output', char: 'o', hasValue: true, hidden: true},
    {name: 'wait-interval', hasValue: true, hidden: true},
    {name: 'at', hasValue: true, hidden: true},
    {name: 'quiet', char: 'q', hidden: true},
  ],
  run: cli.command({preauth: true}, run),
}
