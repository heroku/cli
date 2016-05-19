'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let extend = require('util')._extend
let url = require('url')

function * run (context, heroku) {
  let app = yield heroku.get(`/apps/${context.app}`)
  yield cli.open(url.resolve(app.web_url, context.args.path || ''))
}

let cmd = {
  topic: 'apps',
  command: 'open',
  description: 'open the app in a web browser',
  help: `
Examples:

  $ heroku open -a myapp
  # opens https://myapp.herokuapp.com

  $ heroku open -a myapp /foo
  # opens https://myapp.herokuapp.com/foo
  `,
  needsApp: true,
  needsAuth: true,
  args: [{name: 'path', optional: true}],
  run: cli.command(co.wrap(run))
}

module.exports.open = cmd
module.exports.root = extend({}, cmd)
module.exports.root.topic = 'open'
delete module.exports.root.command
