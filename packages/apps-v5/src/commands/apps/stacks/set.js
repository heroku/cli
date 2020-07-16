'use strict'

const cli = require('heroku-cli-util')
const co = require('co')
const push = require('../../../push')

function map (stack) {
  return stack === 'cedar-10' ? 'cedar' : stack
}

function * run (context, heroku) {
  let stack = map(context.args.stack)
  const request = heroku.request({
    method: 'PATCH',
    path: `/apps/${context.app}`,
    body: { build_stack: stack }
  })
  const app = yield cli.action(`Setting stack to ${cli.color.green(stack)}`, request)
  // A redeploy is not required for apps that have never been deployed, since
  // API updates the app's `stack` to match `build_stack` immediately.
  if (app.stack.name !== app.build_stack.name) {
    cli.log(`You will need to redeploy ${cli.color.app(context.app)} for the change to take effect.`)
    cli.log(`Run ${cli.color.cmd(push(context.flags.remote))} to create a new release on ${cli.color.app(context.app)}.`)
  }
}

let cmd = {
  needsApp: true,
  needsAuth: true,
  description: 'set the stack of an app',
  examples: `$ heroku stack:set heroku-18 -a myapp
Stack set. Next release on myapp will use heroku-18.
Run git push heroku main to create a new release on myapp.`,
  args: [{ name: 'stack' }],
  run: cli.command(co.wrap(run))
}

module.exports = [
  Object.assign({ topic: 'apps', command: 'stacks:set' }, cmd),
  Object.assign({ topic: 'stack', command: 'set', hidden: true }, cmd)
]
