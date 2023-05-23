import {APIClient} from '@heroku-cli/command'
import {AppCompletion, PipelineCompletion, SpaceCompletion, TeamCompletion} from '@heroku-cli/command/lib/completions'
import {Interfaces, CliUx} from '@oclif/core'
import * as fs from 'fs-extra'
import * as path from 'path'

import {updateCache} from '../cache'
import acCreate from '../commands/autocomplete/create'

export const completions: Interfaces.Hook<'app' | 'addon' | 'config' | 'login' | 'logout'> = async function ({type, app}) {
  // autocomplete is now in core, skip windows
  if (this.config.windows) return
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

  // if user is not logged in, exit
  try {
    const heroku = new APIClient(this.config)
    if (!heroku.auth) return
    await heroku.get('/account', {retryAuth: false})
  } catch (error: any) {
    this.debug(error.message)
    return
  }

  CliUx.ux.action.start('Updating completions')
  await rm()
  await acCreate.run([], this.config)

  try {
    await update(AppCompletion, 'app')
    await update(PipelineCompletion, 'pipeline')
    await update(SpaceCompletion, 'space')
    await update(TeamCompletion, 'team')
  } catch (error: any) {
    this.debug(error.message)
  }

  CliUx.ux.action.stop()
}
