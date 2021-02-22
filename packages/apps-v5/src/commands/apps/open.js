'use strict'

let cli = require('heroku-cli-util')
let url = require('url')

async function run(context, heroku) {
  let app = await heroku.get(`/apps/${context.app}`)
  await cli.open(url.resolve(app.web_url, context.args.path || ''))
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
  run: cli.command(run)
}

module.exports = [
  Object.assign({ topic: 'apps', command: 'open' }, cmd),
  Object.assign({ topic: 'open', hidden: true }, cmd)
]
