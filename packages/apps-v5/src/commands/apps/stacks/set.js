'use strict'

const cli = require('heroku-cli-util')
const co = require('co')
const push = require('../../../push')

function map (stack) {
  return stack === 'cedar-10' ? 'cedar' : stack
}

function * run (context, heroku) {
  let stack = map(context.args.stack)
  yield heroku.request({
    method: 'PATCH',
    path: `/apps/${context.app}`,
    body: { build_stack: stack }
  })
  cli.log(`Stack set. Next release on ${cli.color.app(context.app)} will use ${cli.color.green(stack)}.`)
  cli.log(`Run ${cli.color.cmd(push(context.flags.remote))} to create a new release on ${cli.color.app(context.app)}.`)
}

let cmd = {
  needsApp: true,
  needsAuth: true,
  description: 'set the stack of an app',
  examples: `$ heroku stack:set cedar-14 -a myapp
Stack set. Next release on myapp will use cedar-14.
Run git push heroku master to create a new release on myapp.`,
  args: [{ name: 'stack' }],
  run: cli.command(co.wrap(run))
}

module.exports = [
  Object.assign({ topic: 'apps', command: 'stacks:set' }, cmd),
  Object.assign({ topic: 'stack', command: 'set', hidden: true }, cmd)
]
