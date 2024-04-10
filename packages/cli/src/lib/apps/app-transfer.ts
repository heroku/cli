import {APIClient} from '@heroku-cli/command'
import {color} from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

type Options = {
  heroku: APIClient,
  appName: string,
  recipient: string,
  personalToPersonal: boolean,
  bulk: boolean,
}

const getRequestOpts = (options: Options) => {
  const {appName, bulk, recipient, personalToPersonal} = options
  const isPersonalToPersonal = personalToPersonal || personalToPersonal === undefined
  const requestOpts = isPersonalToPersonal ?
    {
      body: {app: appName, recipient},
      transferMsg: `Initiating transfer of ${color.app(appName)}`,
      path: '/account/app-transfers',
      method: 'POST',
    } : {
      body: {owner: recipient},
      transferMsg: `Transferring ${color.app(appName)}`,
      path: `/teams/apps/${appName}`,
      method: 'PATCH',
    }
  if (!bulk) requestOpts.transferMsg += ` to ${color.magenta(recipient)}`
  return requestOpts
}

export const appTransfer = async (options: Options) => {
  const {body, transferMsg, path, method} = getRequestOpts(options)
  ux.action.start(transferMsg)
  const {body: request} = await options.heroku.request<Heroku.TeamApp>(
    path,
    {
      method,
      body,
    },
  )
  const message = request.state === 'pending' ? 'email sent' : undefined
  ux.action.stop(message)
}
