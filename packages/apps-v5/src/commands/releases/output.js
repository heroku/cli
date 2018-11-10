'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
let releases = require('../../releases')
let output = require('../../output')

function * run (context, heroku) {
  let release = yield releases.FindByLatestOrId(heroku, context.app, context.args.release)

  let streamUrl = release.output_stream_url

  if (!streamUrl) {
    cli.warn(`Release v${release.version} has no release output available.`)
    return
  }

  yield output.Stream(streamUrl)
    .catch(err => {
      if (err.statusCode === 404) {
        cli.warn('Release command not started yet. Please try again in a few seconds.')
        return
      }
      throw err
    })
}

module.exports = {
  topic: 'releases',
  command: 'output',
  description: 'View the release command output',
  needsAuth: true,
  needsApp: true,
  args: [{ name: 'release', optional: true }],
  run: cli.command({ preauth: true }, co.wrap(run))
}
