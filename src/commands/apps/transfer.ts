import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {appExtensions} from '@heroku/sdk/extensions/platform'
import {App} from '@heroku/types/3.sdk'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import ConfirmCommand from '../../lib/confirm-command.js'
import {lazyModuleLoader} from '../../lib/lazy-module-loader.js'
import {getOwner, isTeamApp, isValidEmail} from '../../lib/team-utils.js'
import AppsLock from './lock.js'

const heredoc = tsheredoc.default

type Platform = HerokuSDK<readonly [typeof appExtensions]>['platform']

type TransferAppOptions = {appName: string; bulk: boolean; personalToPersonal: boolean; platform: Platform; recipient: string}

async function transferApp({appName, bulk, personalToPersonal, platform, recipient}: TransferAppOptions) {
  let transferMsg = personalToPersonal ? `Initiating transfer of ${color.app(appName)}` : `Transferring ${color.app(appName)}`
  if (!bulk) transferMsg += ` to ${personalToPersonal ? color.user(recipient) : color.team(recipient)}`
  ux.action.start(transferMsg)
  const result = await platform.app.transfer(appName, recipient, {personalToPersonal}) as {state?: string}
  ux.action.stop(result.state === 'pending' ? 'email sent' : undefined)
}

export default class AppsTransfer extends Command {
  static args = {
    recipient: Args.string({description: 'user or team to transfer applications to', required: true}),
  }
  static description = 'transfer applications to another user or team'
  static examples = [heredoc(`
    ${color.command('heroku apps:transfer collaborator@example.com')}
    Transferring example to collaborator@example.com... done`), heredoc(`
    ${color.command('heroku apps:transfer acme-widgets')}
    Transferring example to acme-widgets... done`), heredoc(`
    ${color.command('heroku apps:transfer --bulk acme-widgets')}
    ...`)]
  static flags = {
    app: flags.app(),
    bulk: flags.boolean({description: 'transfer applications in bulk', required: false}),
    confirm: flags.string({char: 'c', hidden: true}),
    locked: flags.boolean({char: 'l', description: 'lock the app upon transfer', required: false}),
    remote: flags.remote({char: 'r'}),
  }
  static topic = 'apps'

  getAppsToTransfer(apps: App[], inquirer: any) {
    return inquirer.prompt([{
      choices: apps.map(app => ({
        name: `${color.app(app.name ?? '')} (${getOwner(app.owner?.email ?? '')})`, value: {name: app.name, owner: app.owner?.email},
      })),
      message: 'Select applications you would like to transfer',
      name: 'choices',
      pageSize: 20,
      type: 'checkbox',
    }])
  }

  public async run() {
    const inquirer = await lazyModuleLoader.loadInquirer()
    const {platform} = new HerokuSDK({extensions: [appExtensions]})

    const {args, flags} = await this.parse(AppsTransfer)
    const {app, bulk, confirm, locked} = flags
    const {recipient} = args
    if (bulk) {
      const allApps = await platform.app.list()
      const selectedApps = await this.getAppsToTransfer(allApps.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')), inquirer)
      ux.warn(`Transferring applications to ${color.name(recipient)}...\n`)
      for (const app of selectedApps.choices) {
        try {
          await transferApp({
            appName: app.name, bulk: true, personalToPersonal: isValidEmail(recipient) && !isTeamApp(app.owner), platform, recipient,
          })
        } catch (error) {
          const {message} = error as {message: string}
          ux.error(message)
        }
      }
    } else {
      const appInfo = await platform.app.info(app)
      const appName = appInfo.name ?? app ?? ''
      if (isValidEmail(recipient) && isTeamApp(appInfo.owner?.email)) {
        await new ConfirmCommand().confirm(appName, confirm, 'All collaborators will be removed from this app')
      }

      await transferApp({
        appName, bulk, personalToPersonal: isValidEmail(recipient) && !isTeamApp(appInfo.owner?.email), platform, recipient,
      })
      if (locked) {
        await AppsLock.run(['--app', appName], this.config)
      }
    }
  }
}
