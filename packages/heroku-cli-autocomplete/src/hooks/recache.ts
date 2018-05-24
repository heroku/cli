import {AppCompletion, PipelineCompletion, SpaceCompletion, TeamCompletion} from '@heroku-cli/command/lib/completions'
import {Hook, IConfig} from '@oclif/config'
import cli from 'cli-ux'
import * as fs from 'fs-extra'
import * as path from 'path'

import acCreate from '../commands/autocomplete/create'

export const completions: Hook<any> = async function ({type, app}: {type?: 'app' | 'addon' | 'config' | 'login' | 'logout', app?: string}) {
  const logInOut = type === 'login' || type === 'logout'
  const cachePath = path.join(this.config.cacheDir, 'autocomplete', 'completions')
  const rm = () => fs.emptyDir(cachePath)
  const rmKey = (cacheKey: string) => fs.remove(path.join(cachePath, cacheKey))

  if (type === 'app') return rmKey('app')
  if (type === 'addon' && app) return rmKey(`${app}_addons`)
  if (type === 'config' && app) return rmKey(`${app}_config_vars`)
  if (logInOut) return rm()

  cli.action.start('Updating completions')
  await rm()
  const config: IConfig = this.config
  await acCreate.run([], config)
  await AppCompletion.options({config})
  await PipelineCompletion.options({config})
  await SpaceCompletion.options({config})
  await TeamCompletion.options({config})
  cli.done()
}
