'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let BuildpackCommand = require('../../lib/buildpacks.js')

function * run (context, heroku) {
  let buildpackCommand = new BuildpackCommand(context, heroku, 'remove', 'removed')

  if (buildpackCommand.url && buildpackCommand.index) {
    cli.exit(1, 'Please choose either index or Buildpack URL, but not both.')
  }

  if (!buildpackCommand.url && !buildpackCommand.index) {
    cli.exit(1, 'Usage: heroku buildpacks:remove [BUILDPACK_URL].\nMust specify a buildpack to remove, either by index or URL.')
  }

  let buildpacksGet = yield buildpackCommand.get()
  if (buildpacksGet.length === 0) {
    cli.exit(1, `No buildpacks were found. Next release on ${context.app} will detect buildpack normally.`)
  }

  var spliceIndex
  if (buildpackCommand.index) {
    buildpackCommand.validateIndexInRange(buildpacksGet)
    spliceIndex = buildpackCommand.findIndex(buildpacksGet)
  } else {
    spliceIndex = buildpackCommand.findUrl(buildpacksGet)
  }

  if (spliceIndex === -1) {
    cli.exit(1, 'Buildpack not found. Nothing was removed.')
  }

  if (buildpacksGet.length === 1) {
    yield buildpackCommand.clear()
  } else {
    yield buildpackCommand.mutate(buildpacksGet, spliceIndex)
  }
}

module.exports = {
  topic: 'buildpacks',
  command: 'remove',
  args: [
    {name: 'url', optional: true}
  ],
  flags: [
    {name: 'index', char: 'i', hasValue: true, description: 'the 1-based index of the URL to remove from the list of URLs'}
  ],
  description: 'remove a buildpack set on the app',
  help: '',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
