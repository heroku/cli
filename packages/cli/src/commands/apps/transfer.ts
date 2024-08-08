import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {sortBy} from 'lodash'
import * as inquirer from 'inquirer'
import {getOwner, isTeamApp, isValidEmail} from '../../lib/teamUtils'
import AppsLock from './lock'
import {appTransfer} from '../../lib/apps/app-transfer'
import confirmCommand from '../../lib/confirmCommand'

function getAppsToTransfer(apps: Heroku.App[]) {
  return inquirer.prompt([{
    type: 'checkbox',
    name: 'choices',
    pageSize: 20,
    message: 'Select applications you would like to transfer',
    choices: apps.map(function (app) {
      return {
        name: `${app.name} (${getOwner(app.owner?.email)})`, value: {name: app.name, owner: app.owner?.email},
      }
    }),
  }])
}

export default class AppsTransfer extends Command {
  static topic = 'apps';
  static description = 'transfer applications to another user or team';
  static flags = {
    locked: flags.boolean({char: 'l', required: false, description: 'lock the app upon transfer'}),
    bulk: flags.boolean({required: false, description: 'transfer applications in bulk'}),
    app: flags.app(),
    remote: flags.remote({char: 'r'}),
    confirm: flags.string({char: 'c', hidden: true}),
  };

  static args = {
    recipient: Args.string({description: 'user or team to transfer applications to', required: true}),
  };

  static examples = [`$ heroku apps:transfer collaborator@example.com
Transferring example to collaborator@example.com... done

$ heroku apps:transfer acme-widgets
Transferring example to acme-widgets... done

$ heroku apps:transfer --bulk acme-widgets
...`]

  public async run() {
    const {flags, args} = await this.parse(AppsTransfer)
    const {app, bulk, locked, confirm} = flags
    const recipient = args.recipient
    if (bulk) {
      const {body: allApps} = await this.heroku.get<Heroku.App[]>('/apps')
      const selectedApps = await getAppsToTransfer(sortBy(allApps, 'name'))
      ux.warn(`Transferring applications to ${color.magenta(recipient)}...\n`)
      for (const app of selectedApps.choices) {
        try {
          await appTransfer({
            heroku: this.heroku,
            appName: app.name,
            recipient: recipient,
            personalToPersonal: isValidEmail(recipient) && !isTeamApp(app.owner),
            bulk: true,
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
        await confirmCommand(appName, confirm, 'All collaborators will be removed from this app')
      }

      await appTransfer({
        heroku: this.heroku,
        appName,
        recipient,
        personalToPersonal: isValidEmail(recipient) && !isTeamApp(appInfo.owner?.email),
        bulk,
      })
      if (locked) {
        await AppsLock.run(['--app', appName], this.config)
      }
    }
  }
}
