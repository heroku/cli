import * as strftime from 'strftime'

export function ago(since: any) {
  const elapsed = Math.floor((Date.now() - since) / 1000)
  const message = strftime('%Y/%m/%d %H:%M:%S %z', since)
  if (elapsed < 60) return `${message} (~ ${Math.floor(elapsed)}s ago)`
  if (elapsed < 60 * 60) return `${message} (~ ${Math.floor(elapsed / 60)}m ago)`
  if (elapsed < 60 * 60 * 25) return `${message} (~ ${Math.floor(elapsed / 60 / 60)}h ago)`
  return message
}

export function remaining(from: number, to: number) {
  const secs = Math.floor((to / 1000) - (from / 1000))
  const mins = Math.floor(secs / 60)
  const hours = Math.floor(mins / 60)
  if (hours > 0) return `${hours}h ${mins % 60}m`
  if (mins > 0) return `${mins}m ${secs % 60}s`
  if (secs > 0) return `${secs}s`
  return ''
}
