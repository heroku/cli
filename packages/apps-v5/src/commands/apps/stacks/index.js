'use strict'

let cli = require('@heroku/heroku-cli-util')

function map(stack) {
  if (stack === 'cedar') {
    return 'cedar-10'
  }

  return stack
}

async function run(context, heroku) {
  const _ = require('lodash')
  let [app, stacks] = await Promise.all([
    heroku.get(`/apps/${context.app}`),
    heroku.get('/stacks'),
  ])
  stacks = _.sortBy(stacks, 'name')
  cli.styledHeader(`${cli.color.app(app.name)} Available Stacks`)
  for (let stack of stacks) {
    if (stack.name === app.stack.name) {
      cli.log(cli.color.green('* ' + map(stack.name)))
    } else if (stack.name === app.build_stack.name) {
      cli.log(`  ${map(stack.name)} (active on next deploy)`)
    } else {
      cli.log(`  ${map(stack.name)}`)
    }
  }
}

let cmd = {
  description: 'show the list of available stacks',
  needsApp: true,
  needsAuth: true,
  run: cli.command(run),
}

module.exports = [
  Object.assign({topic: 'apps', command: 'stacks'}, cmd),
  Object.assign({topic: 'stack', hidden: true}, cmd),
]
