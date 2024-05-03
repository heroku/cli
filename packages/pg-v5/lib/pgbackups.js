'use strict'

const cli = require('@heroku/heroku-cli-util')

function prefix(transfer) {
  if (transfer.from_type === 'pg_dump') {
    if (transfer.to_type === 'pg_restore') {
      return 'c'
    }

    return transfer.schedule ? 'a' : 'b'

  // eslint-disable-next-line no-else-return
  } else {
    // eslint-disable-next-line no-lonely-if
    if (transfer.to_type === 'pg_restore') {
      return 'r'
    }

    return 'b'
  }
}

module.exports = (context, heroku) => ({
  filesize: (size, opts = {}) => {
    Object.assign(opts, {
      decimalPlaces: 2,
      fixedDecimals: true,
    })
    const bytes = require('bytes')
    return bytes(size, opts)
  },
  transfer: {
    num: async function (name) {
      let m = name.match(/^[abcr](\d+)$/)
      if (m) return Number.parseInt(m[1])
      m = name.match(/^o[ab]\d+$/)
      if (m) {
        const host = require('./host')()
        let transfers = await heroku.get(`/client/v11/apps/${context.app}/transfers`, {host})
        let transfer = transfers.find(t => module.exports(context, heroku).transfer.name(t) === name)
        if (transfer) return transfer.num
      }
    },
    name: transfer => {
      let oldPGBName = transfer.options && transfer.options.pgbackups_name
      if (oldPGBName) return `o${oldPGBName}`
      return `${prefix(transfer)}${(transfer.num || '').toString().padStart(3, '0')}`
    },
    status: transfer => {
      if (transfer.finished_at && transfer.succeeded) {
        let warnings = transfer.warnings
        if (warnings > 0) {
          return `Finished with ${warnings} warnings`
        }

        return `Completed ${transfer.finished_at}`
      }

      if (transfer.finished_at) {
        return `Failed ${transfer.finished_at}`
      }

      if (transfer.started_at) {
        return `Running (processed ${module.exports(context, heroku).filesize(transfer.processed_bytes)})`
      }

      return 'Pending'
    },
  },
  wait: (action, transferID, interval, verbose, app) => {
    if (app === undefined) {
      app = context.app
    }

    const host = require('./host')()
    const pgbackups = module.exports(context, heroku)

    let shownLogs = []
    let displayLogs = logs => {
      for (let log of logs) {
        if (shownLogs.find(l => l.created_at === log.created_at && l.message === log.message)) continue
        shownLogs.push(log)
        cli.log(`${log.created_at} ${log.message}`)
      }
    }

    let poll = async function () {
      let tty = process.env.TERM !== 'dumb' && process.stderr.isTTY
      let backup
      let failures = 0

      let quietUrl = `/client/v11/apps/${app}/transfers/${transferID}`
      let verboseUrl = quietUrl + '?verbose=true'

      let url = verbose ? verboseUrl : quietUrl

      while (true) {
        try {
          backup = await heroku.get(url, {host})
        } catch (error) {
          if (failures++ > 20) throw error
        }

        if (verbose) {
          displayLogs(backup.logs)
        } else if (tty) {
          let msg = backup.started_at ? pgbackups.filesize(backup.processed_bytes) : 'pending'
          let log = backup.logs && backup.logs.pop()
          if (log) {
            cli.action.status(`${msg}\n${log.created_at + ' ' + log.message}`)
          } else {
            cli.action.status(msg)
          }
        }

        if (backup && backup.finished_at) {
          if (backup.succeeded) return

          // logs is undefined unless verbose=true is passed
          backup = await heroku.get(verboseUrl, {host})

          throw new Error(`An error occurred and the backup did not finish.

${backup.logs.slice(-5).map(l => l.message).join('\n')}

Run ${cli.color.cmd('heroku pg:backups:info ' + pgbackups.transfer.name(backup))} for more details.`)
        }

        await new Promise(resolve => setTimeout(resolve, interval * 1000))
      }
    }

    if (verbose) {
      cli.log(`${action}...`)
      return poll()
    }

    return cli.action(action, poll())
  },
})
