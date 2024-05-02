'use strict'

const cli = require('@heroku/heroku-cli-util')

const getProcessType = s => s.split('-', 2)[0].split('.', 2)[0]
const getProcessNum = s => Number.parseInt(s.split('-', 2)[0].split('.', 2)[1])

async function run(context, heroku) {
  let spaceName = context.flags.space || context.args.space
  if (!spaceName) throw new Error('Space name required.\nUSAGE: heroku spaces:topology my-space')

  let topology = await heroku.get(`/spaces/${spaceName}/topology`)
  let appInfo = []
  if (topology.apps) {
    appInfo = await Promise.all(topology.apps.map(app => heroku.get(`/apps/${app.id}`)))
  }

  render(spaceName, topology, appInfo, context.flags)
}

function render(spaceName, topology, appInfo, flags) {
  if (flags.json) {
    cli.styledJSON(topology)
  } else {
    // eslint-disable-next-line no-lonely-if
    if (topology.apps) {
      topology.apps.forEach(app => {
        let formations = []
        let dynos = []

        if (app.formations) {
          app.formations.forEach(formation => {
            formations.push(formation.process_type)

            if (formation.dynos) {
              formation.dynos.forEach(dyno => {
                let dynoS = [`${formation.process_type}.${dyno.number}`, dyno.private_ip, dyno.hostname].filter(Boolean)
                dynos.push(dynoS.join(' - '))
              })
            }
          })
        }

        let domains = app.domains.sort()
        formations = formations.sort()
        dynos = dynos.sort((a, b) => {
          let apt = getProcessType(a)
          let bpt = getProcessType(b)
          if (apt > bpt) {
            return 1
          }

          if (apt < bpt) {
            return -1
          }

          return getProcessNum(a) - getProcessNum(b)
        })

        let info = appInfo.find(info => info.id === app.id)
        let header = info.name
        if (formations.length > 0) {
          header += ` (${cli.color.cyan(formations.join(', '))})`
        }

        cli.styledHeader(header)
        cli.styledObject({
          Domains: domains,
          Dynos: dynos,
        }, ['Domains', 'Dynos'])
        cli.log()
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
    {name: 'json', description: 'output in json format'},
  ],
  render: render,
  run: cli.command(run),
}
