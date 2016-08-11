'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function parseConfig (args) {
  let config = {}
  while (args.length > 0) {
    let key = args.shift()
    if (!key.startsWith('--')) throw new Error(`Unexpected argument ${key}`)
    key = key.replace(/^--/, '')
    let val = args.shift()
    if (!val) {
      config[key] = true
    } else if (val.startsWith('--')) {
      config[key] = true
      args.unshift(val)
    } else {
      config[key] = val
    }
  }
  return config
}

function expandHPG (plan) {
  if (!plan) throw new Error('Missing requested service or plan')
  plan = plan.replace(/^hpg:/, 'heroku-postgresql:')
  plan = plan.replace(/^heroku-postgresql:s-/, 'heroku-postgresql:standard-')
  plan = plan.replace(/^heroku-postgresql:p-/, 'heroku-postgresql:premium-')
  plan = plan.replace(/^heroku-postgresql:e-/, 'heroku-postgresql:enterprise-')
  return plan
}

function * run (context, heroku) {
  const util = require('../../lib/util')

  let {app, flags, args} = context
  let {name, as, confirm} = flags
  let plan = {name: expandHPG(args.shift())}
  let config = parseConfig(args)

  let addon
  yield cli.action(`Creating ${plan.name} on ${cli.color.app(app)}`, co(function * () {
    addon = yield heroku.post(`/apps/${app}/addons`, {
      body: { config, name, confirm, plan, attachment: {name: as} },
      headers: {
        'accept-expansion': 'plan',
        'x-heroku-legacy-provider-messages': 'true'
      }
    })
    cli.action.done(cli.color.green(util.formatPrice(addon.plan.price)))
  }))
  let configVars = addon.config_vars.map(c => cli.color.configVar(c)).join(', ')
  cli.log(`Created ${cli.color.addon(addon.name)} as ${configVars}`)
  if (addon.provision_message) cli.log(addon.provision_message)
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
    {name: 'as', description: 'name for the initial add-on attachment'},
    {name: 'confirm', description: 'overwrite existing config vars or existing add-on attachments'}
  ],
  run: cli.command({preauth: true}, co.wrap(run))
}

module.exports = [
  Object.assign({command: 'create'}, cmd),
  Object.assign({command: 'add', hidden: true}, cmd)
]
