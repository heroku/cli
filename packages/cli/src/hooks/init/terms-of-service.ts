import {Hook} from '@oclif/config'
import * as path from 'path'
import * as fs from 'fs-extra'
import cli from 'cli-ux'

export function checkTos(options: any) {
  const tosPath: string = path.join(options.config.cacheDir, 'terms-of-service')
  const viewedBanner = fs.pathExistsSync(tosPath)
  const message = 'Our terms of service have changed: https://dashboard.heroku.com/terms-of-service'

  if (!viewedBanner) {
    cli.warn(message)
    fs.createFile(tosPath)
  }
}

const hook: Hook.Init = async function (options) {
  checkTos(options)
}

export default hook
