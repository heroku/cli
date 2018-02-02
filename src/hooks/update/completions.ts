import {Hook} from '@cli-engine/engine'
import {Config} from '@cli-engine/engine/lib/config'
import {IHooks} from '@cli-engine/engine/lib/hooks'
import {AppCompletion, PipelineCompletion, SpaceCompletion, TeamCompletion} from '@heroku-cli/command/lib/completions'
import cli from 'cli-ux'

const debug = require('debug')('heroku:completions')

export default class CompletionsUpdateHook extends Hook<'update'> {
  protected config: Config
  constructor(config: Config, options: IHooks['update']) {
    super(config, options)
  }

  async run() {
    try {
      const config = this.config
      if (this.config.windows) {
        debug('skipping autocomplete on windows')
      } else {
        const plugins = await this.config.plugins.list()
        const acPlugin = plugins.find(p => p.name === 'heroku-cli-autocomplete')
        if (acPlugin) {
          cli.action.start('Updating completions')
          let ac = await acPlugin.findCommand('autocomplete:buildcache')
          if (ac) await ac.run([], config)
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
}
