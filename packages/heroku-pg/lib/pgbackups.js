'use strict'

const co = require('co')

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
    const filesize = require('filesize')
    return filesize(size, opts)
  },
  transfer: {
    num: co.wrap(function * (name) {
      let m = name.match(/^[abcr](\d+)$/)
      if (m) return parseInt(m[1])
      m = name.match(/^o[ab]\d+$/)
      if (m) {
        const host = require('./host')()
        let transfers = yield heroku.get(`/client/v11/apps/${context.app}/transfers`, {host})
        let transfer = transfers.find(t => module.exports(context, heroku).transfer.name(t) === name)
        if (transfer) return transfer.num
      }
    }),
    name: transfer => {
      let S = require('string')

      let oldPGBName = transfer.options && transfer.options.pgbackups_name
      if (oldPGBName) return `o${oldPGBName}`
      return `${prefix(transfer)}${S(transfer.num).padLeft(3, '0')}`
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
  }
})
