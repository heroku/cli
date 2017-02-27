'use strict'

const cli = require('heroku-cli-util')
const _ = require('lodash')
const co = require('co')

function * run (context, heroku) {
  let spaceName = context.flags.space || context.args.space
  if (!spaceName) throw new Error('Space name required.\nUSAGE: heroku spaces:topology my-space')

  let topology = yield heroku.get(`/spaces/${spaceName}/topology`)
  let appInfo = yield _.map(topology.apps, (app) => heroku.get(`/apps/${app.id}`))

  render(spaceName, topology, appInfo, context.flags)
}

function render (spaceName, topology, appInfo, flags) {
  if (flags.json) {
    cli.styledJSON(topology)
  } else {
    cli.styledHeader(spaceName)
    _.forEach(topology.apps, (app) => {
      let formations = []
      let dynos = []
      _.forEach(app.formations, (formation) => {
        formations.push(formation.process_type)
        _.forEach(formation.dynos, (dyno) => {
          let dynoS = [`${formation.process_type}.${dyno.number}`, dyno.private_ip, dyno.hostname].filter(Boolean)
          dynos.push(dynoS.join(' - '))
        })
      })

      let info = _.find(appInfo, (info) => info.id === app.id)
      cli.styledObject({
        App: info.name,
        Domains: app.domains,
        Formations: formations,
        Dynos: dynos
      }, ['App', 'Domains', 'Formations', 'Dynos'])
    })
  }
}

module.exports = {
  topic: 'spaces',
  command: 'topology',
  description: 'show space topology',
  needsAuth: true,
  args: [{name: 'space', optional: true, hidden: true}],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space to get topology of'},
    {name: 'json', description: 'output in json format'}
  ],
  render: render,
  run: cli.command(co.wrap(run))
}
