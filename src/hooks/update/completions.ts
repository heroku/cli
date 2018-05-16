import {AppCompletion, PipelineCompletion, SpaceCompletion, TeamCompletion} from '@heroku-cli/command/lib/completions'
import {Hook, IConfig} from '@oclif/config'
import cli from 'cli-ux'

const debug = require('debug')('heroku:completions')

export const completions: Hook<'update'> = async function () {
  if (this.config.windows) {
    debug('skipping autocomplete on windows')
  } else {
    const acPlugin = this.config.plugins.find(p => p.name === '@heroku-cli/plugin-autocomplete')
    if (acPlugin) {
      cli.action.start('Updating completions')
      let acCreate = await acPlugin.findCommand('autocomplete:create')
      if (acCreate) {
        const config: IConfig = this.config
        await acCreate.run([], config)
        await AppCompletion.options({config})
        await PipelineCompletion.options({config})
        await SpaceCompletion.options({config})
        await TeamCompletion.options({config})
      }
    } else {
      debug('skipping autocomplete, not installed')
    }
    cli.done()
  }
}
