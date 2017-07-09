'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function map (stack) {
  if (stack === 'cedar') {
    return 'cedar-10'
  }
  return stack
}

function * run (context, heroku) {
  let data = yield {
    app: heroku.get(`/apps/${context.app}`),
    stacks: heroku.get('/stacks')
  }
  cli.styledHeader(`${cli.color.app(data.app.name)} Available Stacks`)
  for (let stack of data.stacks) {
    if (stack.name === data.app.stack.name) {
      cli.log(cli.color.green('* ' + map(stack.name)))
    } else {
      cli.log(`  ${map(stack.name)}`)
    }
  }
}

let cmd = {
  description: 'show the list of available stacks',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}

module.exports = [
  Object.assign({topic: 'apps', command: 'stacks'}, cmd),
  Object.assign({topic: 'stack', hidden: true}, cmd)
]
