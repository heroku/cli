'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

const costs = {'Free': 0, 'Hobby': 7, 'Standard-1X': 25, 'Standard-2X': 50, 'Performance-M': 250, 'Performance': 500, 'Performance-L': 500, '1X': 36, '2X': 72, 'PX': 576}

let emptyFormationErr = (app) => {
  return new Error(`No process types on ${app}.
Upload a Procfile to add process types.
https://devcenter.heroku.com/articles/procfile`)
}

function * run (context, heroku) {
  const compact = require('lodash.compact')
  const sortBy = require('lodash.sortby')

  let app = context.app

  let parse = co.wrap(function * (args) {
    if (args.length === 0) return []
    let formation = yield heroku.get(`/apps/${app}/formation`)
    if (args.find((a) => a.match(/=/))) {
      return compact(args.map((arg) => {
        let match = arg.match(/^([a-zA-Z0-9_]+)=([\w-]+)$/)
        let type = match[1]
        let size = match[2]
        if (!formation.find((p) => p.type === type)) {
          throw new Error(`Type ${cli.color.red(type)} not found in process formation.
Types: ${cli.color.yellow(formation.map((f) => f.type).join(', '))}`)
        }
        return {type, size}
      }))
    } else {
      return formation.map((p) => ({type: p.type, size: args[0]}))
    }
  })

  let displayFormation = co.wrap(function * () {
    let formation = yield heroku.get(`/apps/${app}/formation`)
    formation = sortBy(formation, 'type')
    formation = formation.map((d) => ({
      type: cli.color.green(d.type),
      size: cli.color.cyan(d.size),
      qty: cli.color.yellow(d.quantity.toString()),
      'cost/mo': costs[d.size] ? (costs[d.size] * d.quantity).toString() : ''
    }))

    if (formation.length === 0) throw emptyFormationErr()

    cli.table(formation, {
      columns: [
        {key: 'type'},
        {key: 'size'},
        {key: 'qty'},
        {key: 'cost/mo'}
      ]
    })
  })

  let changes = yield parse(context.args)
  if (changes.length > 0) {
    yield cli.action(`Scaling dynos on ${cli.color.app(app)}`,
      heroku.request({method: 'PATCH', path: `/apps/${app}/formation`, body: {updates: changes}})
    )
  }
  yield displayFormation()
}

let cmd = {
  variableArgs: true,
  description: 'manage dyno sizes',
  help: `
Called with no arguments shows the current dyno size.

Called with one argument sets the size.
Where SIZE is one of free|hobby|standard-1x|standard-2x|performance

Called with 1..n TYPE=SIZE arguments sets the quantity per type.
`,
  needsAuth: true,
  needsApp: true,
  run: cli.command(co.wrap(run))
}

exports.type = Object.assign({}, cmd, {topic: 'ps', command: 'type'})
exports.psResize = Object.assign({}, cmd, {topic: 'ps', command: 'resize'})
exports.resize = Object.assign({}, cmd, {topic: 'resize', command: null})
exports.dynoType = Object.assign({}, cmd, {topic: 'dyno', command: 'type'})
exports.dynoResize = Object.assign({}, cmd, {topic: 'dyno', command: 'resize'})
