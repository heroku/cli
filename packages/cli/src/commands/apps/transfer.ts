import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {sortBy} from 'lodash'
import * as inquirer from 'inquirer'
import {getOwner} from '../../lib/access/utils'
import lock from './lock'

let AppTransfer = require('../../lib/app_transfer')
let lock = require('./lock.js')[0]
function getAppsToTransfer(apps) {
  return inquirer.prompt([{
    type: 'checkbox', name: 'choices', pageSize: 20, message: 'Select applications you would like to transfer', choices: apps.map(function (app) {
      return {
        name: `${app.name} (${getOwner(app.owner.email)})`, value: {name: app.name, owner: app.owner.email},
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
    };

    static args = {
      recipient: Args.string({description: 'user or team to transfer applications to', required: true}),
    };

    public async run(): Promise<void> {
      const {flags, argv, args} = await this.parse(AppsTransfer)
      const {app, bulk, locked} = flags
      let recipient = args.recipient
      if (bulk) {
        let allApps = await this.heroku.get('/apps')
        let selectedApps = await getAppsToTransfer(sortBy(allApps, 'name'))
        console.error(`Transferring applications to ${color.magenta(recipient)}...\n`)
        for (let app of selectedApps.choices) {
          try {
            let appTransfer = new AppTransfer({
              heroku: heroku, appName: app.name, recipient: recipient, personalToPersonal: Utils.isValidEmail(recipient) && !Utils.isteamApp(app.owner), bulk: true,
            })
            await appTransfer.start()
          } catch (error) {
            ux.error(error)
          }
        }
      } else {
        let appInfo = await this.heroku.get(`/apps/${app}`)
        if (Utils.isValidEmail(recipient) && Utils.isteamApp(appInfo.owner.email)) {
          await cli.confirmApp(app, confirm, 'All collaborators will be removed from this app')
        }

        let appTransfer = new AppTransfer({
          heroku: heroku, appName: appInfo.name, recipient: recipient, personalToPersonal: Utils.isValidEmail(recipient) && !Utils.isteamApp(appInfo.owner.email),
        })
        await appTransfer.start()
        if (locked) {
          await lock.run(context)
        }
      }
    }
}
