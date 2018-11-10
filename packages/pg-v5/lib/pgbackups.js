'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function prefix (transfer) {
  if (transfer.from_type === 'pg_dump') {
    if (transfer.to_type === 'pg_restore') {
      return 'c'
    } else {
      return transfer.schedule ? 'a' : 'b'
    }
  } else {
    if (transfer.to_type === 'pg_restore') {
      return 'r'
    } else {
      return 'b'
    }
  }
}

module.exports = (context, heroku) => ({
  filesize: (size, opts = {}) => {
    Object.assign(opts, {
      decimalPlaces: 2,
      fixedDecimals: true
    })
    const bytes = require('bytes')
    return bytes(size, opts)
  },
  transfer: {
    num: co.wrap(function * (name) {
      let m = name.match(/^[abcr](\d+)$/)
      if (m) return parseInt(m[1])
      m = name.match(/^o[ab]\d+$/)
      if (m) {
        const host = require('./host')()
        let transfers = yield heroku.get(`/client/v11/apps/${context.app}/transfers`, { host })
        let transfer = transfers.find(t => module.exports(context, heroku).transfer.name(t) === name)
        if (transfer) return transfer.num
      }
    }),
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
        } else {
          return `Completed ${transfer.finished_at}`
        }
      } else if (transfer.finished_at) {
        return `Failed ${transfer.finished_at}`
      } else if (transfer.started_at) {
        return `Running (processed ${module.exports(context, heroku).filesize(transfer.processed_bytes)})`
      } else {
        return 'Pending'
      }
    }
  },
  wait: (action, transferID, interval, verbose, app) => {
    if (app === undefined) {
      app = context.app
    }
    const wait = require('co-wait')
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

    let poll = co.wrap(function * () {
      let tty = process.env.TERM !== 'dumb' && process.stderr.isTTY
      let backup
      let failures = 0

      let quietUrl = `/client/v11/apps/${app}/transfers/${transferID}`
      let verboseUrl = quietUrl + '?verbose=true'

      let url = verbose ? verboseUrl : quietUrl

      while (true) {
        try {
          backup = yield heroku.get(url, { host })
        } catch (err) {
          if (failures++ > 20) throw err
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
          else {
            // logs is undefined unless verbose=true is passed
            backup = yield heroku.get(verboseUrl, { host })

            throw new Error(`An error occurred and the backup did not finish.

${backup.logs.slice(-5).map(l => l.message).join('\n')}

Run ${cli.color.cmd('heroku pg:backups:info ' + pgbackups.transfer.name(backup))} for more details.`)
          }
        }
        yield wait(interval * 1000)
      }
    })

    if (verbose) {
      cli.log(`${action}...`)
      return poll()
    } else {
      return cli.action(action, poll())
    }
  }
})
