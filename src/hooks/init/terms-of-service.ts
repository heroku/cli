import {Hook} from '@oclif/core/hooks'
import {ux} from '@oclif/core/ux'
import fs from 'fs-extra'
import path from 'node:path'

export async function checkTos(options: any) {
  const tosPath: string = path.join(options.config.cacheDir, 'terms-of-service')
  const viewedBanner = await fs.pathExists(tosPath)
  const message = 'Our terms of service have changed: https://dashboard.heroku.com/terms-of-service'

  if (!viewedBanner) {
    ux.warn(message)
    await fs.createFile(tosPath)
  }
}

const hook: Hook.Init = async function (options) {
  await checkTos(options)
}

export default hook
