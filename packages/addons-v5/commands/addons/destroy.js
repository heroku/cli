/* eslint-disable no-await-in-loop */

'use strict'

const cli = require('@heroku/heroku-cli-util')
const {notify} = require('../../lib/notify')

async function run(context, heroku) {
  const destroyAddon = require('../../lib/destroy_addon')
  const resolve = require('../../lib/resolve')
  const {groupBy, toPairs} = require('lodash')
  const force = context.flags.force || process.env.HEROKU_FORCE === '1'
  const wait = context.flags.wait || false

  if (context.args.length === 0) throw new Error('Missing add-on name')

  let addons = await Promise.all(
    context.args.map(name => resolve.addon(heroku, context.app, name)),
  )

  for (const addon of addons) {
    // prevent deletion of add-on when context.app is set but the addon is attached to a different app
    const app = addon.app.name
    if (context.app && app !== context.app) throw new Error(`${cli.color.addon(addon.name)} is on ${cli.color.app(app)} not ${cli.color.app(context.app)}`)
  }

  for (let app of toPairs(groupBy(addons, 'app.name'))) {
    addons = app[1]
    app = app[0]

    await cli.confirmApp(app, context.flags.confirm)

    for (const addon of addons) {
      try {
        await destroyAddon(heroku, addon, force, wait)
        if (wait) {
          notify(`heroku addons:destroy ${addon.name}`, 'Add-on successfully deprovisioned')
        }
      } catch (error) {
        if (wait) {
          notify(`heroku addons:destroy ${addon.name}`, 'Add-on failed to deprovision', false)
        }

        throw error
      }
    }
  }
}

const cmd = {
  topic: 'addons',
  description: 'permanently destroy an add-on resource',
  usage: 'addons:destroy [ADDON]... [flags]',
  needsAuth: true,
  wantsApp: true,
  flags: [
    {name: 'force', char: 'f', description: 'allow destruction even if connected to other apps'},
    {name: 'confirm', char: 'c', hasValue: true},
    {name: 'wait', description: 'watch add-on destruction status and exit when complete'},
  ],
  variableArgs: true,
  run: cli.command({preauth: true}, run),
}

module.exports = [
  Object.assign({command: 'destroy'}, cmd),
  Object.assign({command: 'remove', hidden: true}, cmd),
]
