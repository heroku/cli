import {Config} from 'cli-engine-config'
import {PluginsParseHookOptions} from 'cli-engine/lib/hooks'

function getID (c: any): string {
  let id = []
  if (c.topic) id.push(c.topic)
  if (c.command) id.push(c.command)
  return id.join(':')
}

module.exports = (_: Config, opts: PluginsParseHookOptions) => {
  const m = opts.module
  m.commands = m.commands.map((c: any) => {
    if (!c.id) c.id = getID(c)
    return c
  })
}
