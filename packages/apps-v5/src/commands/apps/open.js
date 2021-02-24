'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let url = require('url')

function * run (context, heroku) {
  let app = yield heroku.get(`/apps/${context.app}`)
  yield cli.open(url.resolve(app.web_url, context.args.path || ''))
}

let cmd = {
  description: 'open the app in a web browser',
  examples: `$ heroku open -a myapp
# opens https://myapp.herokuapp.com

$ heroku open -a myapp /foo
# opens https://myapp.herokuapp.com/foo`,
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'path', optional: true }],
  run: cli.command(co.wrap(run))
}

module.exports = [
  Object.assign({ topic: 'apps', command: 'open' }, cmd),
  Object.assign({ topic: 'open', hidden: true }, cmd)
]
