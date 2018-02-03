// import {AppCompletion, PipelineCompletion, SpaceCompletion, TeamCompletion} from '@heroku-cli/command/lib/completions'
import cli from 'cli-ux'

import {Hook} from '@anycli/config'

const debug = require('debug')('heroku:completions')

const hook: Hook<'update'> = async opts => {
  const config = opts.config
  if (config.windows) {
    debug('skipping autocomplete on windows')
  } else {
    // const plugins = await config.plugins.list()
    // const acPlugin = plugins.find(p => p.name === 'heroku-cli-autocomplete')
    // if (acPlugin) {
    //   cli.action.start('Updating completions')
    //   let ac = await acPlugin.findCommand('autocomplete:buildcache')
    //   if (ac) await ac.run([], config)
    //   await AppCompletion.options({config})
    //   await PipelineCompletion.options({config})
    //   await SpaceCompletion.options({config})
    //   await TeamCompletion.options({config})
    // } else {
      debug('skipping autocomplete, not installed')
    }
  cli.action.stop()
}

export default hook
