import lodash from 'ts-lodash'
import {PluginsParseOptions} from 'cli-engine/lib/hooks'
import {Config} from 'cli-engine-config'
import {Command} from 'cli-engine-heroku'

// const debug = require('debug')('heroku:plugins:parse')

async function run (_: Config, opts: PluginsParseOptions) {
  let m = opts.module
  m.commands = m.commands.map((c: any) => {
    class LegacyCommand extends Command {
      static __config = {
        id: lodash.compact([c.topic, c.command]).join(':'),
        plugin: opts.plugin,
        _version: require('cli-engine-command/package.json').version,
      }
      options = {
        topic: c.topic,
        command: c.command,
        description: c.description
      }
      async run () {
        console.log('x')
      }
    }
    return LegacyCommand
  })
}

export = run
