import {AppCompletion, PipelineCompletion, SpaceCompletion, TeamCompletion} from '@heroku-cli/command/lib/completions'
import {Hook, IConfig, load} from '@oclif/config'
import cli from 'cli-ux'

const debug = require('debug')('heroku:completions')

export const completions: Hook<'update'> = async function () {
  if (this.config.windows) {
    debug('skipping autocomplete on windows')
  } else {
    const acPlugin = this.config.plugins.find(p => p.name === 'heroku-cli-autocomplete')
    if (acPlugin) {
      cli.action.start('Updating completions')
      let ac = await acPlugin.findCommand('autocomplete:buildcache')
      if (ac) await ac.run([], this.config)
      let config: IConfig = Object.assign(await load(), this.config)
      await AppCompletion.options({config})
      await PipelineCompletion.options({config})
      await SpaceCompletion.options({config})
      await TeamCompletion.options({config})
    } else {
      debug('skipping autocomplete, not installed')
    }
    cli.done()
  }
}
