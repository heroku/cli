'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

let emptyFormationErr = (app) => {
  return new Error(`No process types on ${cli.color.app(app)}.
Upload a Procfile to add process types.
https://devcenter.heroku.com/articles/procfile`)
}

function * run (context, heroku) {
  const compact = require('lodash.compact')
  let app = context.app

  function parse (args) {
    return compact(args.map((arg) => {
      let change = arg.match(/^([a-zA-Z0-9_]+)([=+-]\d+)(?::([\w-]+))?$/)
      if (!change) return
      let quantity = change[2][0] === '=' ? change[2].substr(1) : change[2]
      return {type: change[1], quantity, size: change[3]}
    }))
  }

  let changes = parse(context.args)
  if (changes.length === 0) {
    let formation = yield heroku.get(`/apps/${app}/formation`)
    if (formation.length === 0) throw emptyFormationErr(app)
    cli.log(formation.map((d) => `${d.type}=${d.quantity}:${d.size}`).sort().join(' '))
  } else {
    yield cli.action('Scaling dynos', {success: false}, co(function * () {
      let formation = yield heroku.request({method: 'PATCH', path: `/apps/${app}/formation`, body: {updates: changes}})
      let output = formation.filter((f) => changes.find((c) => c.type === f.type))
        .map((d) => `${cli.color.green(d.type)} at ${d.quantity}:${d.size}`)
      cli.action.done(`done, now running ${output.join(', ')}`)
    }))
  }
}

let cmd = {
  variableArgs: true,
  description: 'scale dyno quantity up or down',
  help: `Appending a size (eg. web=2:Standard-2X) allows simultaneous scaling and resizing.

Omitting any arguments will display the app's current dyno formation, in a
format suitable for passing back into ps:scale.

Examples:

  $ heroku ps:scale web=3:Standard-2X worker+1
  Scaling dynos... done, now running web at 3:Standard-2X, worker at 1:Standard-1X.

  $ heroku ps:scale
  web=3:Standard-2X worker=1:Standard-1X
`,
  needsAuth: true,
  needsApp: true,
  run: cli.command(co.wrap(run))
}

exports.ps = Object.assign({}, cmd, {topic: 'ps', command: 'scale'})
exports.root = Object.assign({}, cmd, {topic: 'scale', command: null})
exports.dyno = Object.assign({}, cmd, {topic: 'dyno', command: 'scale'})
