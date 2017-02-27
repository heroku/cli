'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  let spaceName = context.flags.space || context.args.space
  if (!spaceName) throw new Error('Space name required.\nUSAGE: heroku spaces:topology my-space')

  let topology = yield heroku.get(`/spaces/${spaceName}/topology`)
  let appInfo = []
  if (topology.apps) {
    appInfo = yield topology.apps.map((app) => heroku.get(`/apps/${app.id}`))
  }

  render(spaceName, topology, appInfo, context.flags)
}

function render (spaceName, topology, appInfo, flags) {
  if (flags.json) {
    cli.styledJSON(topology)
  } else {
    cli.styledHeader(spaceName)
    if (topology.apps) {
      topology.apps.forEach((app) => {
        let formations = []
        let dynos = []

        if (app.formations) {
          app.formations.forEach((formation) => {
            formations.push(formation.process_type)

            if (formation.dynos) {
              formation.dynos.forEach((dyno) => {
                let dynoS = [`${formation.process_type}.${dyno.number}`, dyno.private_ip, dyno.hostname].filter(Boolean)
                dynos.push(dynoS.join(' - '))
              })
            }
          })
        }

        let info = appInfo.find((info) => info.id === app.id)
        cli.styledObject({
          App: info.name,
          Domains: app.domains,
          Formations: formations,
          Dynos: dynos
        }, ['App', 'Domains', 'Formations', 'Dynos'])
        cli.log('')
      })
    }
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
