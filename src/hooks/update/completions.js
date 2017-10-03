// @flow

import cli from 'cli-ux'
import Plugins from 'cli-engine/lib/plugins'
import type {Config} from 'cli-engine-config'
import type {PreRun} from 'cli-engine/lib/hooks'
import {AppCompletion, PipelineCompletion, SpaceCompletion, TeamCompletion} from 'cli-engine-heroku/lib/completions'

const debug = require('debug')('heroku:completions')

async function run (config: Config, opts: PreRun) {
  try {
    if (config.windows) {
      debug('skipping autocomplete on windows')
    } else {
      const plugins = await (new Plugins(config)).list()
      const acPlugin = plugins.find(p => p.name === 'heroku-cli-autocomplete')
      if (acPlugin) {
        cli.action.start('Updating completions')
        let ac = await acPlugin.findCommand('autocomplete:init')
        if (ac) await ac.run(config)
        await AppCompletion.options({config})
        await PipelineCompletion.options({config})
        await SpaceCompletion.options({config})
        await TeamCompletion.options({config})
      } else {
        debug('skipping autocomplete, not installed')
      }
      cli.done()
    }
  } catch (err) {
    debug(err)
  }
}

module.exports = run
