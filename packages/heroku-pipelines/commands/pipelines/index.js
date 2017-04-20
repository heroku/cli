'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

const cmd = {
  topic: 'pipelines',
  description: 'list pipelines you have access to',
  help: 'Example:\n  $ heroku pipelines\n  === My Pipelines\n  example\n  sushi',
  flags: [
    {name: 'json', description: 'output in json format'}
  ],
  needsAuth: true,
  run: cli.command(co.wrap(function* (context, heroku) {
    let pipelines = yield heroku.get('/pipelines')

    if (context.flags.json) {
      cli.styledJSON(pipelines)
    } else {
      cli.styledHeader(`My Pipelines`)
      for (let pipeline of pipelines) cli.log(pipeline.name)
    }
  }))
}

module.exports = [
  cmd,
  Object.assign({command: 'list'}, cmd)
]
