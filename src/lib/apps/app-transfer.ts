import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {appExtensions} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core/ux'

type Platform = HerokuSDK<readonly [typeof appExtensions]>['platform']

type Options = {
  appName: string,
  bulk: boolean,
  personalToPersonal: boolean,
  platform: Platform,
  recipient: string,
}

export const appTransfer = async (options: Options) => {
  const {appName, bulk, personalToPersonal, platform, recipient} = options
  const isPersonalToPersonal = personalToPersonal || personalToPersonal === undefined
  let transferMsg = isPersonalToPersonal
    ? `Initiating transfer of ${color.app(appName)}`
    : `Transferring ${color.app(appName)}`
  if (!bulk) transferMsg += ` to ${isPersonalToPersonal ? color.user(recipient) : color.team(recipient)}`
  ux.action.start(transferMsg)
  const request = await platform.app.transfer(appName, recipient, {personalToPersonal: isPersonalToPersonal}) as {state?: string}
  const message = request.state === 'pending' ? 'email sent' : undefined
  ux.action.stop(message)
}
