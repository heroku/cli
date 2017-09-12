// @flow

import Plugins from 'cli-engine'
import type {Config} from 'cli-engine-config'
import type {PreRun} from 'cli-engine/lib/hooks'
import {AppCompletion, PipelineCompletion, SpaceCompletion, TeamCompletion} from 'cli-engine-heroku/lib/completions'

const debug = require('debug')('heroku:completions')

async function run (config: Config, opts: PreRun) {
  try {
    if (this.config.windows) {
      debug('skipping autocomplete on windows')
    } else {
      const plugins = await new Plugins(this.config).list()
      const acPlugin = plugins.find(p => p.name === 'heroku-cli-autocomplete')
      if (acPlugin) {
        let ac = await acPlugin.findCommand('autocomplete:init')
        if (ac) await ac.run(this.config)
      } else {
        debug('skipping autocomplete, not installed')
      }
      await AppCompletion.options({out: this.out})
      await PipelineCompletion.options({out: this.out})
      await SpaceCompletion.options({out: this.out})
      await TeamCompletion.options({out: this.out})
    }
  } catch (err) {
    debug(err)
  }
}

module.exports = run
