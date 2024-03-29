'use strict'

function ago(since) {
  const strftime = require('strftime')
  let elapsed = Math.floor((Date.now() - since) / 1000)
  let message = strftime('%Y/%m/%d %H:%M:%S %z', since)
  if (elapsed < 60) return `${message} (~ ${Math.floor(elapsed)}s ago)`
  if (elapsed < 60 * 60) return `${message} (~ ${Math.floor(elapsed / 60)}m ago)`
  if (elapsed < 60 * 60 * 25) return `${message} (~ ${Math.floor(elapsed / 60 / 60)}h ago)`
  return message
}

function remaining(from, to) {
  // eslint-disable-next-line no-mixed-operators
  let secs = Math.floor(to / 1000 - from / 1000)
  let mins = Math.floor(secs / 60)
  let hours = Math.floor(mins / 60)
  if (hours > 0) return `${hours}h ${mins % 60}m`
  if (mins > 0) return `${mins}m ${secs % 60}s`
  if (secs > 0) return `${secs}s`
  return ''
}

module.exports = {
  ago,
  remaining,
}
