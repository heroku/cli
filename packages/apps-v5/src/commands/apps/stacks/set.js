'use strict'

const cli = require('@heroku/heroku-cli-util')
const push = require('../../../push')

function map(stack) {
  return stack === 'cedar-10' ? 'cedar' : stack
}

async function run(context, heroku) {
  let stack = map(context.args.stack)
  const request = heroku.request({
    method: 'PATCH',
    path: `/apps/${context.app}`,
    body: {build_stack: stack},
  })
  const app = await cli.action(`Setting stack to ${cli.color.green(stack)}`, request)
  // A redeploy is not required for apps that have never been deployed, since
  // API updates the app's `stack` to match `build_stack` immediately.
  if (app.stack.name !== app.build_stack.name) {
    cli.log(`You will need to redeploy ${cli.color.app(context.app)} for the change to take effect.`)
    cli.log(`Run ${cli.color.cmd(push(context.flags.remote))} to trigger a new build on ${cli.color.app(context.app)}.`)
  }
}

let cmd = {
  needsApp: true,
  needsAuth: true,
  description: 'set the stack of an app',
  examples: `$ heroku stack:set heroku-22 -a myapp
Setting stack to heroku-22... done
You will need to redeploy myapp for the change to take effect.
Run git push heroku main to trigger a new build on myapp.`,
  args: [{name: 'stack'}],
  run: cli.command(run),
}

module.exports = [
  Object.assign({topic: 'apps', command: 'stacks:set'}, cmd),
  Object.assign({topic: 'stack', command: 'set', hidden: true}, cmd),
]
