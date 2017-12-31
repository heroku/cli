import { Hook } from '@cli-engine/engine/lib/hooks'
const debug = require('debug')('heroku:completions')
import cli from 'cli-ux'
import { Plugins } from '@cli-engine/engine/lib/plugins'
import { AppCompletion, PipelineCompletion, SpaceCompletion, TeamCompletion } from '@heroku-cli/command/lib/completions'

export default class CompletionsUpdateHook extends Hook<'update'> {
  async run() {
    try {
      const config = this.config
      if (this.config.windows) {
        debug('skipping autocomplete on windows')
      } else {
        const plugins = await new Plugins(this.config).list()
        const acPlugin = plugins.find(p => p.name === 'heroku-cli-autocomplete')
        if (acPlugin) {
          cli.action.start('Updating completions')
          let ac = await acPlugin.findCommand('autocomplete:buildcache')
          if (ac) await ac.run([], config)
          await AppCompletion.options({ config })
          await PipelineCompletion.options({ config })
          await SpaceCompletion.options({ config })
          await TeamCompletion.options({ config })
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
