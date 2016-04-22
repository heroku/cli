'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

let BuildpackCommand = require('../../lib/buildpacks.js')

function * run (context, heroku) {
  let buildpackCommand = new BuildpackCommand(context, heroku, 'set', 'set')

  buildpackCommand.validateUrlPassed()

  let buildpacksGet = yield buildpackCommand.get()

  buildpackCommand.validateUrlNotSet(buildpacksGet)

  var spliceIndex
  if (buildpackCommand.index === null) {
    spliceIndex = 0
  } else {
    let foundIndex = buildpackCommand.findIndex(buildpacksGet, buildpackCommand.index)
    spliceIndex = (foundIndex === -1) ? buildpacksGet.length : foundIndex
  }

  yield buildpackCommand.mutate(buildpacksGet, spliceIndex)
}

module.exports = {
  topic: 'buildpacks',
  command: 'set',
  args: [
    {name: 'url', optional: false}
  ],
  flags: [
    {name: 'index', char: 'i', hasValue: true, description: 'the 1-based index of the URL in the list of URLs'}
  ],
  description: 'set new app buildpack, overwriting into list of buildpacks if necessary',
  help: `Example:

 $ heroku buildpacks:set -i 1 https://github.com/heroku/heroku-buildpack-ruby
`,
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
