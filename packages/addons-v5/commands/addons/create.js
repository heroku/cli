'use strict'

const cli = require('heroku-cli-util')
const { notify } = require('../../lib/notify')

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

async function run(context, heroku) {
  let createAddon = require('../../lib/create_addon')

  let { app, flags, args } = context
  if (args.length === 0) {
    throw new Error('Usage: heroku addons:create SERVICE:PLAN')
  }

  let { name, as } = flags
  let config = parseConfig(args.slice(1))
  let addon

  try {
    addon = await createAddon(heroku, app, args[0], context.flags.confirm, context.flags.wait, { config, name, as })
    if (context.flags.wait) {
      notify(`heroku addons:create ${addon.name}`, 'Add-on successfully provisioned')
    }
  } catch (error) {
    if (context.flags.wait) {
      notify(`heroku addons:create ${args[0]}`, 'Add-on failed to provision', false)
    }
    throw error
  }

  await context.config.runHook('recache', { type: 'addon', app, addon })
  cli.log(`Use ${cli.color.cmd('heroku addons:docs ' + addon.addon_service.name)} to view documentation`)
}

const cmd = {
  topic: 'addons',
  description: 'create a new add-on resource',
  needsAuth: true,
  needsApp: true,
  args: [{ name: 'service:plan' }],
  variableArgs: true,
  flags: [
    { name: 'name', description: 'name for the add-on resource', hasValue: true },
    { name: 'as', description: 'name for the initial add-on attachment', hasValue: true },
    { name: 'confirm', description: 'overwrite existing config vars or existing add-on attachments', hasValue: true },
    { name: 'wait', description: 'watch add-on creation status and exit when complete' }
  ],
  run: cli.command({ preauth: true }, run)
}

module.exports = [
  Object.assign({ command: 'create' }, cmd),
  Object.assign({ command: 'add', hidden: true }, cmd)
]
