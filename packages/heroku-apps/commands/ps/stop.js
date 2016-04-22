'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
let qs = require('querystring')

function * run (context, heroku) {
  let app = context.app
  let dyno = context.args.dyno
  let type = dyno.indexOf('.') !== -1 ? 'ps' : 'type'

  yield cli.action(`Stopping ${cli.color.cyan(dyno)} ${type === 'ps' ? 'dyno' : 'dynos'} on ${cli.color.app(app)}`, co(function * () {
    yield heroku.request({
      method: 'POST',
      path: `/apps/${app}/ps/stop?` + qs.stringify({[type]: dyno}),
      parseJSON: false,
      headers: {Accept: 'application/json'}
    })
  }))
}

let cmd = {
  description: 'stop app dyno',
  help: `
stop app dyno or dyno type

Examples:

  $ heroku ps:stop run.1828
  Stopping run.1828 dyno... done

  $ heroku ps:stop run
  Stopping run dynos... done
`,
  needsAuth: true,
  needsApp: true,
  args: [{name: 'dyno'}],
  run: cli.command(co.wrap(run))
}

exports.ps = Object.assign({}, cmd, {topic: 'ps', command: 'stop'})
exports.dyno = Object.assign({}, cmd, {topic: 'dyno', command: 'stop'})
exports.stop = Object.assign({}, cmd, {topic: 'stop', command: null})
exports.psKill = Object.assign({}, cmd, {topic: 'ps', command: 'kill'})
exports.dynoKill = Object.assign({}, cmd, {topic: 'dyno', command: 'kill'})
exports.kill = Object.assign({}, cmd, {topic: 'kill', command: null})
