import {AppCompletion, PipelineCompletion, SpaceCompletion, TeamCompletion} from '@heroku-cli/command/lib/completions'
import {Hook} from '@oclif/config'
import cli from 'cli-ux'
import * as fs from 'fs-extra'
import * as path from 'path'

import {updateCache} from '../cache'
import acCreate from '../commands/autocomplete/create'

export const completions: Hook<any> = async function ({type, app}: {type?: 'app' | 'addon' | 'config' | 'login' | 'logout', app?: string}) {
  const logInOut = type === 'login' || type === 'logout'
  const completionsDir = path.join(this.config.cacheDir, 'autocomplete', 'completions')
  const rm = () => fs.emptyDir(completionsDir)
  const rmKey = (cacheKey: string) => fs.remove(path.join(completionsDir, cacheKey))

  if (type === 'app') return rmKey('app')
  if (type === 'addon' && app) return rmKey(`${app}_addons`)
  if (type === 'config' && app) return rmKey(`${app}_config_vars`)
  if (logInOut) return rm()

  const update = async (completion: any, cacheKey: string) => {
    const cachePath = path.join(completionsDir, cacheKey)
    const options = await completion.options({config: this.config})
    await updateCache(cachePath, options)
  }

  cli.action.start('Updating completions')
  await rm()
  await acCreate.run([], this.config)
  await update(AppCompletion, 'app')
  await update(PipelineCompletion, 'pipeline')
  await update(SpaceCompletion, 'space')
  await update(TeamCompletion, 'team')
  cli.done()
}
