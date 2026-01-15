import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import inquirer from 'inquirer'

import {appTransfer} from '../../lib/apps/app-transfer.js'
import ConfirmCommand from '../../lib/confirmCommand.js'
import {getOwner, isTeamApp, isValidEmail} from '../../lib/teamUtils.js'
import AppsLock from './lock.js'

export default class AppsTransfer extends Command {
  static args = {
    recipient: Args.string({description: 'user or team to transfer applications to', required: true}),
  }

  static description = 'transfer applications to another user or team'
  static examples = [`$ heroku apps:transfer collaborator@example.com
Transferring example to collaborator@example.com... done

$ heroku apps:transfer acme-widgets
Transferring example to acme-widgets... done

$ heroku apps:transfer --bulk acme-widgets
...`]

  static flags = {
    app: flags.app(),
    bulk: flags.boolean({description: 'transfer applications in bulk', required: false}),
    confirm: flags.string({char: 'c', hidden: true}),
    locked: flags.boolean({char: 'l', description: 'lock the app upon transfer', required: false}),
    remote: flags.remote({char: 'r'}),
  }

  static topic = 'apps'

  getAppsToTransfer(apps: Heroku.App[]) {
    return inquirer.prompt([{
      choices: apps.map(app => ({
        name: `${color.app(app.name)} (${getOwner(app.owner?.email)})`, value: {name: app.name, owner: app.owner?.email},
      })),
      message: 'Select applications you would like to transfer',
      name: 'choices',
      pageSize: 20,
      type: 'checkbox',
    }])
  }

  public async run() {
    const {args, flags} = await this.parse(AppsTransfer)
    const {app, bulk, confirm, locked} = flags
    const {recipient} = args
    if (bulk) {
      const {body: allApps} = await this.heroku.get<Heroku.App[]>('/apps')
      const selectedApps = await this.getAppsToTransfer(allApps.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')))
      ux.warn(`Transferring applications to ${color.magenta(recipient)}...\n`)
      for (const app of selectedApps.choices) {
        try {
          await appTransfer({
            appName: app.name,
            bulk: true,
            heroku: this.heroku,
            personalToPersonal: isValidEmail(recipient) && !isTeamApp(app.owner),
            recipient,
          })
        } catch (error) {
          const {message} = error as {message: string}
          ux.error(message)
        }
      }
    } else {
      const {body: appInfo} = await this.heroku.get<Heroku.App>(`/apps/${app}`)
      const appName = appInfo.name ?? app ?? ''
      if (isValidEmail(recipient) && isTeamApp(appInfo.owner?.email)) {
        await new ConfirmCommand().confirm(appName, confirm, 'All collaborators will be removed from this app')
      }

      await appTransfer({
        appName,
        bulk,
        heroku: this.heroku,
        personalToPersonal: isValidEmail(recipient) && !isTeamApp(appInfo.owner?.email),
        recipient,
      })
      if (locked) {
        await AppsLock.run(['--app', appName], this.config)
      }
    }
  }
}
