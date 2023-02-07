import {Hook, CliUx} from '@oclif/core'
import path from 'path'
import fs from 'fs-extra'

export function checkTos(options: any) {
  const tosPath: string = path.join(options.config.cacheDir, 'terms-of-service')
  const viewedBanner = fs.pathExistsSync(tosPath)
  const message = 'Our terms of service have changed: https://dashboard.heroku.com/terms-of-service'

  if (!viewedBanner) {
    CliUx.ux.warn(message)
    fs.createFile(tosPath)
  }
}

const hook: Hook.Init = async function (options) {
  checkTos(options)
}

export default hook
