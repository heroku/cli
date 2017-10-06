import lodash from 'ts-lodash'
import {PluginsParseOptions} from 'cli-engine/lib/hooks'
import {Config} from 'cli-engine-config'
import {Command} from 'cli-engine-heroku'

// const debug = require('debug')('heroku:plugins:parse')

async function run (_: Config, opts: PluginsParseOptions) {
  let m = opts.module
  m.commands = m.commands.map((c: any) => {
    class LegacyCommand extends Command {
      options = {
        topic: c.topic,
        command: c.command,
        description: c.description
      }
      async _run () {
        console.log('x')
      }
    }
    LegacyCommand.__config.id = lodash.compact([c.topic, c.command]).join(':')
    LegacyCommand.__config.plugin = opts.plugin
    return LegacyCommand
  })
}

export = run
