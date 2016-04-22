'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function map (stack) {
  return stack === 'cedar-10' ? 'cedar' : stack
}

function * run (context, heroku) {
  let stack = map(context.args.stack)
  yield heroku.request({
    method: 'PATCH',
    path: `/apps/${context.app}`,
    body: {build_stack: stack}
  })
  cli.log(`Stack set. Next release on ${cli.color.app(context.app)} will use ${cli.color.green(stack)}.`)
  cli.log(`Run ${cli.color.cmd('git push heroku master')} to create a new release on ${cli.color.app(context.app)}.`)
}

let cmd = {
  topic: 'stack',
  command: 'set',
  needsApp: true,
  needsAuth: true,
  description: 'set the stack of an app',
  help: `
Example:

  $ heroku stack:set cedar-14 -a myapp
  Stack set. Next release on myapp will use cedar-14.
  Run git push heroku master to create a new release on myapp.`,
  args: [{name: 'stack'}],
  run: cli.command(co.wrap(run))
}

exports.apps = Object.assign({}, cmd, {topic: 'apps', command: 'stacks:set'})
exports.root = Object.assign({}, cmd, {topic: 'stack', command: 'set'})
