'use strict'

const cli = require('heroku-cli-util')
const co = require('co')
let waitForAddonProvisioning = require('../../lib/addons_wait')

function parseConfig (args) {
  let config = {}
  while (args.length > 0) {
    let key = args.shift()
    if (!key.startsWith('--')) throw new Error(`Unexpected argument ${key}`)
    key = key.replace(/^--/, '')
    let val
    if (key.includes('=')) {
      [key, ...val] = key.split('=')
      val = val.join('=')
      if (val === 'true') { val = true }
      config[key] = val
    } else {
      val = args.shift()
      if (!val) {
        config[key] = true
      } else if (val.startsWith('--')) {
        config[key] = true
        args.unshift(val)
      } else {
        config[key] = val
      }
    }
  }
  return config
}

function formatConfigVarsMessage (addon) {
  let configVars = (addon.config_vars || [])

  if (configVars.length > 0) {
    configVars = configVars.map(c => cli.color.configVar(c)).join(', ')
    return `Created ${cli.color.addon(addon.name)} as ${configVars}`
  } else {
    return `Created ${cli.color.addon(addon.name)}`
  }
}

function * run (context, heroku) {
  const util = require('../../lib/util')

  let {app, flags, args} = context
  let {name, as} = flags
  let plan = {name: args[0]}
  let config = parseConfig(args.slice(1))

  function createAddon (app, config, name, confirm, plan, as) {
    return cli.action(`Creating ${plan.name} on ${cli.color.app(app)}`,
      heroku.post(`/apps/${app}/addons`, {
        body: { config, name, confirm, plan, attachment: {name: as} },
        headers: {
          'accept-expansion': 'plan',
          'x-heroku-legacy-provider-messages': 'true'
        }
      }).then(function (addon) {
        cli.action.done(cli.color.green(util.formatPrice(addon.plan.price)))
        return addon
      })
    )
  }

  let addon = yield util.trapConfirmationRequired(context, (confirm) => (createAddon(app, config, name, confirm, plan, as)))

  if (addon.provision_message) { cli.log(addon.provision_message) }

  if (addon.state === 'provisioning') {
    if (context.flags.wait) {
      cli.log(`Waiting for ${cli.color.addon(addon.name)}...`)
      addon = yield waitForAddonProvisioning(context, heroku, addon, 5)
      cli.log(formatConfigVarsMessage(addon))
    } else {
      cli.log(`${cli.color.addon(addon.name)} is being created in the background. The app will restart when complete...`)
      cli.log(`Use ${cli.color.cmd('heroku addons:info ' + addon.name)} to check creation progress`)
    }
  } else if (addon.state === 'deprovisioned') {
    throw new Error(`The add-on was unable to be created, with status ${addon.state}`)
  } else {
    cli.log(formatConfigVarsMessage(addon))
  }

  cli.log(`Use ${cli.color.cmd('heroku addons:docs ' + addon.addon_service.name)} to view documentation`)
}

const cmd = {
  topic: 'addons',
  description: 'create an add-on resource',
  needsAuth: true,
  needsApp: true,
  args: [{name: 'service:plan'}],
  variableArgs: true,
  flags: [
    {name: 'name', description: 'name for the add-on resource', hasValue: true},
    {name: 'as', description: 'name for the initial add-on attachment', hasValue: true},
    {name: 'confirm', description: 'overwrite existing config vars or existing add-on attachments', hasValue: true},
    {name: 'wait', description: 'watch add-on creation status and exit when complete'}
  ],
  run: cli.command({preauth: true}, co.wrap(run))
}

module.exports = [
  Object.assign({command: 'create'}, cmd),
  Object.assign({command: 'add', hidden: true}, cmd)
]
