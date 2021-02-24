'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function styledDrain (id, name, drain) {
  let output = `${id} (${name})`
  if (drain.extended) output = output + ` drain_id=${drain.extended.drain_id}`
  cli.log(output)
}

function * run (context, heroku) {
  const { partition } = require('lodash')

  let path = `/apps/${context.app}/log-drains`
  if (context.flags.extended) path = path + '?extended=true'
  let drains = yield heroku.request({ path })
  if (context.flags.json) {
    cli.styledJSON(drains)
  } else {
    drains = partition(drains, 'addon')
    if (drains[1].length > 0) {
      cli.styledHeader('Drains')
      drains[1].forEach((drain) => {
        styledDrain(drain.url, cli.color.green(drain.token), drain)
      })
    }
    if (drains[0].length > 0) {
      let addons = yield drains[0].map((d) => heroku.get(`/apps/${context.app}/addons/${d.addon.name}`))
      cli.styledHeader('Add-on Drains')
      addons.forEach((addon, i) => {
        styledDrain(cli.color.yellow(addon.plan.name), cli.color.green(addon.name), drains[0][i])
      })
    }
  }
}

module.exports = {
  topic: 'drains',
  description: 'display the log drains of an app',
  needsApp: true,
  needsAuth: true,
  flags: [
    { name: 'json', description: 'output in json format' },
    { name: 'extended', char: 'x', hidden: true }
  ],
  run: cli.command(co.wrap(run))
}
