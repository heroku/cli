'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

let context
let heroku
let app
let name
let plan
let addon
let service

function noPlanError () {
  throw new Error(`Error: No plan specified.
You need to specify a plan to move ${cli.color.yellow(name)} to.
For example: ${cli.color.blue('heroku addons:upgrade heroku-redis:premium-0')}

${cli.color.cyan('https://devcenter.heroku.com/articles/managing-add-ons')}`)
}

function handlePlanChangeAPIError (err) {
  const { sortBy } = require('lodash')

  if (err.statusCode === 422 && err.body.message && err.body.message.startsWith("Couldn't find either the add-on")) {
    return heroku.get(`/addon-services/${service}/plans`)
      .then((plans) => {
        plans = sortBy(plans, 'price.cents').map((plans) => plans.name)
        throw new Error(`${err.body.message}

Here are the available plans for ${cli.color.yellow(service)}:
${plans.join('\n')}

See more plan information with ${cli.color.blue('heroku addons:plans ' + service)}

${cli.color.cyan('https://devcenter.heroku.com/articles/managing-add-ons')}`)
      })
  }
  throw err
}

function handleAPIError (err) {
  if (err.statusCode === 422 && err.body.id === 'multiple_matches') {
    let example = err.body.message.split(', ')[2] || 'redis-triangular-1234'
    throw new Error(`${err.body.message}

Multiple add-ons match ${cli.color.yellow(name)}${app ? ' on ' + app : ''}
It is not clear which add-on's plan you are trying to change.

Specify the add-on name instead of the name of the add-on service.
For example, instead of: ${cli.color.blue('heroku addons:upgrade ' + context.args.addon + ' ' + (context.args.plan || ''))}
Run this: ${cli.color.blue('heroku addons:upgrade ' + example + ' ' + name + ':' + plan)}
${!app ? 'Alternatively, specify an app to filter by with ' + cli.color.blue('--app') : ''}
${cli.color.cyan('https://devcenter.heroku.com/articles/managing-add-ons')}`)
  }
  throw err
}

function * run (c, h) {
  const resolver = require('../../lib/resolve')
  const util = require('../../lib/util')

  context = c
  heroku = h
  app = context.app
  name = context.args.addon
  plan = context.args.plan

  // called with just one argument in the form of `heroku addons:upgrade heroku-redis:hobby`
  if (!plan && name.indexOf(':') !== -1) {
    let s = name.split(':')
    name = s[0]
    plan = s[1]
  }

  if (!plan) noPlanError()
  // ignore the service part of the plan since we can infer the service based on the add-on
  if (plan.indexOf(':') !== -1) plan = plan.split(':')[1]

  // find the add-on to be changed
  addon = yield resolver.addon(h, app, name).catch((e) => handleAPIError(e))

  service = addon.addon_service.name
  app = addon.app.name
  plan = `${service}:${plan}`
  yield cli.action(`Changing ${cli.color.magenta(addon.name)} on ${cli.color.cyan(app)} from ${cli.color.blue(addon.plan.name)} to ${cli.color.blue(plan)}`, { success: false }, co(function * () {
    addon = yield heroku.request({
      path: `/apps/${app}/addons/${addon.name}`,
      method: 'PATCH',
      body: { plan: { name: plan } },
      headers: {
        'Accept-Expansion': 'plan',
        'X-Heroku-Legacy-Provider-Messages': 'true'
      }
    }).catch((e) => handlePlanChangeAPIError(e))
    cli.action.done(`done, ${cli.color.green(util.formatPrice(addon.plan.price))}`)
    if (addon.provision_message) cli.log(addon.provision_message)
  }))
}

let cmd = {
  topic: 'addons',
  description: 'change add-on plan',
  help: `See available plans with \`heroku addons:plans SERVICE\`.

Note that \`heroku addons:upgrade\` and \`heroku addons:downgrade\` are the same.
Either one can be used to change an add-on plan up or down.

[https://devcenter.heroku.com/articles/managing-add-ons](https://devcenter.heroku.com/articles/managing-add-ons)`,
  examples: [
    `Upgrade an add-on by service name:
$ heroku addons:upgrade heroku-redis:premium-2

Upgrade a specific add-on:
$ heroku addons:upgrade swimming-briskly-123 heroku-redis:premium-2`
  ],
  needsAuth: true,
  wantsApp: true,
  args: [{ name: 'addon' }, { name: 'plan', optional: true }],
  run: cli.command({ preauth: true }, co.wrap(run))
}

module.exports = [
  Object.assign({ command: 'upgrade' }, cmd),
  Object.assign({ command: 'downgrade' }, cmd)
]
