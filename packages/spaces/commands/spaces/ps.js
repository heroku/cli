'use strict'

const cli = require('heroku-cli-util')
const strftime = require('strftime')
const _ = require('lodash')

const getProcessNum = (s) => parseInt(s.split('.', 2)[1])

function timeAgo (since) {
  let elapsed = Math.floor((new Date() - since) / 1000)
  let message = strftime('%Y/%m/%d %H:%M:%S %z', since)
  if (elapsed < 60) return `${message} (~ ${Math.floor(elapsed)}s ago)`
  else if (elapsed < 60 * 60) return `${message} (~ ${Math.floor(elapsed / 60)}m ago)`
  else if (elapsed < 60 * 60 * 25) return `${message} (~ ${Math.floor(elapsed / 60 / 60)}h ago)`
  else return message
}

async function run (context, heroku) {
  const spaceName = context.flags.space || context.args.space
  if (!spaceName) throw new Error('Space name required.\nUSAGE: heroku spaces:ps my-space')

  const [spaceDynos, space] = await Promise.all([
    heroku.get(`/spaces/${spaceName}/dynos`),
    heroku.get(`/spaces/${spaceName}`)
  ])

  if (space.shield) {
    spaceDynos.forEach(spaceDyno => {
      spaceDyno.dynos.forEach(d => {
        if (d.size) {
          d.size = d.size.replace('Private-', 'Shield-')
        }
      })
    })
  }

  if (context.flags.json) {
    cli.styledJSON(spaceDynos)
  } else {
    render(spaceDynos)
  }
}

function render (spaceDynos) {
  _.forEach(spaceDynos, (spaceDyno) => {
    printDynos(spaceDyno.app_name, spaceDyno.dynos)
  })
}

function printDynos (appName, dynos) {
  let dynosByCommand = _.reduce(dynos, function (dynosByCommand, dyno) {
    let since = timeAgo(new Date(dyno.updated_at))
    let size = dyno.size || '1X'

    if (dyno.type === 'run') {
      let key = 'run: one-off processes'
      if (dynosByCommand[key] === undefined) dynosByCommand[key] = []
      dynosByCommand[key].push(`${dyno.name} (${size}): ${dyno.state} ${since}: ${dyno.command}`)
    } else {
      let key = `${cli.color.green(dyno.type)} (${cli.color.cyan(size)}): ${dyno.command}`
      if (dynosByCommand[key] === undefined) dynosByCommand[key] = []
      let state = dyno.state === 'up' ? cli.color.green(dyno.state) : cli.color.yellow(dyno.state)
      let item = `${dyno.name}: ${cli.color.green(state)} ${cli.color.dim(since)}`
      dynosByCommand[key].push(item)
    }
    return dynosByCommand
  }, {})
  _.forEach(dynosByCommand, function (dynos, key) {
    cli.styledHeader(`${appName} ${key} (${cli.color.yellow(dynos.length)})`)
    dynos = dynos.sort((a, b) => getProcessNum(a) - getProcessNum(b))
    for (let dyno of dynos) cli.log(dyno)
    cli.log()
  })
}

module.exports = {
  topic: 'spaces',
  command: 'ps',
  description: 'list dynos for a space',
  needsAuth: true,
  args: [{ name: 'space', optional: true, hidden: true }],
  flags: [
    { name: 'space', char: 's', hasValue: true, description: 'space to get dynos of' },
    { name: 'json', description: 'output in json format' }
  ],
  run: cli.command(run)
}
