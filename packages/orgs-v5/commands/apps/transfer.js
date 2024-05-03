'use strict'

let _ = require('lodash')
let AppTransfer = require('../../lib/app_transfer')
let cli = require('@heroku/heroku-cli-util')
let inquirer = require('inquirer')
let lock = require('./lock.js')[0]
let Utils = require('../../lib/utils')

function getAppsToTransfer(apps) {
  return inquirer.prompt([{
    type: 'checkbox',
    name: 'choices',
    pageSize: 20,
    message: 'Select applications you would like to transfer',
    choices: apps.map(function (app) {
      return {
        name: `${app.name} (${Utils.getOwner(app.owner.email)})`,
        value: {name: app.name, owner: app.owner.email},
      }
    }),
  }])
}

async function run(context, heroku) {
  let app = context.app
  let recipient = context.args.recipient

  // App transfers in bulk
  if (context.flags.bulk) {
    let allApps = await heroku.get('/apps')
    let selectedApps = await getAppsToTransfer(_.sortBy(allApps, 'name'))
    cli.console.error(`Transferring applications to ${cli.color.magenta(recipient)}...
`)

    for (let app of selectedApps.choices) {
      try {
        let appTransfer = new AppTransfer({
          heroku: heroku,
          appName: app.name,
          recipient: recipient,
          personalToPersonal: Utils.isValidEmail(recipient) && !Utils.isteamApp(app.owner),
          bulk: true,
        })
        await appTransfer.start()
      } catch (error) {
        cli.error(error)
      }
    }
  } else { // Single app transfer
    let appInfo = await heroku.get(`/apps/${app}`)

    // Shows warning when app is transferred from a team/org to a personal account
    if (Utils.isValidEmail(recipient) && Utils.isteamApp(appInfo.owner.email)) {
      await cli.confirmApp(app, context.flags.confirm, 'All collaborators will be removed from this app')
    }

    let appTransfer = new AppTransfer({
      heroku: heroku,
      appName: appInfo.name,
      recipient: recipient,
      personalToPersonal: Utils.isValidEmail(recipient) && !Utils.isteamApp(appInfo.owner.email),
    })
    await appTransfer.start()

    if (context.flags.locked) {
      await lock.run(context)
    }
  }
}

let cmd = {
  topic: 'apps',
  command: 'transfer',
  description: 'transfer applications to another user or team',
  needsAuth: true,
  wantsApp: true,
  run: cli.command(run),
  args: [
    {name: 'recipient', description: 'user or team to transfer applications to'},
  ],
  flags: [
    {name: 'locked', char: 'l', hasValue: false, required: false, description: 'lock the app upon transfer'},
    {name: 'bulk', hasValue: false, required: false, description: 'transfer applications in bulk'},
  ],
  examples: `$ heroku apps:transfer collaborator@example.com
Transferring example to collaborator@example.com... done

$ heroku apps:transfer acme-widgets
Transferring example to acme-widgets... done

$ heroku apps:transfer --bulk acme-widgets
...`,
}

module.exports = [
  cmd,
  {
    topic: 'sharing',
    command: 'transfer',
    help: 'this command is now heroku apps:transfer',
    variableArgs: true,
    hidden: true,
    run: () => {
      cli.error(`This command is now ${cli.color.cyan('heroku apps:transfer')}`)
      process.exit(1)
    },
  },
]
