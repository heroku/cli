'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let BuildpackCommand = require('../../buildpacks.js')

function * run (context, heroku) {
  let buildpacksCommand = new BuildpackCommand(context, heroku)

  let buildpacks = yield buildpacksCommand.get()
  if (buildpacks.length === 0) {
    cli.log(`${context.app} has no Buildpack URL set.`)
  } else {
    cli.styledHeader(`${context.app} Buildpack URL${buildpacks.length > 1 ? 's' : ''}`)
    buildpacksCommand.display(buildpacks, '')
  }
}

module.exports = {
  topic: 'buildpacks',
  description: 'display the buildpack_url(s) for an app',
  help: `Examples:
    $ heroku buildpacks
`,
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
