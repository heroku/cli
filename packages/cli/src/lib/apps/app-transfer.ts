import {color} from '@heroku/heroku-cli-util'
import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

type Options = {
  appName: string,
  bulk: boolean,
  heroku: APIClient,
  personalToPersonal: boolean,
  recipient: string,
}

const getRequestOpts = (options: Options) => {
  const {appName, bulk, personalToPersonal, recipient} = options
  const isPersonalToPersonal = personalToPersonal || personalToPersonal === undefined
  const requestOpts = isPersonalToPersonal
    ? {
      body: {app: appName, recipient},
      method: 'POST',
      path: '/account/app-transfers',
      transferMsg: `Initiating transfer of ${color.app(appName)}`,
    } : {
      body: {owner: recipient},
      method: 'PATCH',
      path: `/teams/apps/${appName}`,
      transferMsg: `Transferring ${color.app(appName)}`,
    }
  if (!bulk) requestOpts.transferMsg += ` to ${color.magenta(recipient)}`
  return requestOpts
}

export const appTransfer = async (options: Options) => {
  const {body, method, path, transferMsg} = getRequestOpts(options)
  ux.action.start(transferMsg)
  const {body: request} = await options.heroku.request<Heroku.TeamApp>(
    path,
    {
      body,
      method,
    },
  )
  const message = request.state === 'pending' ? 'email sent' : undefined
  ux.action.stop(message)
}
