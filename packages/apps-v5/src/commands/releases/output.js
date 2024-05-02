'use strict'

let cli = require('@heroku/heroku-cli-util')
let releases = require('../../releases')
let output = require('../../output')

async function run(context, heroku) {
  // eslint-disable-next-line new-cap
  let release = await releases.FindByLatestOrId(heroku, context.app, context.args.release)

  let streamUrl = release.output_stream_url

  if (!streamUrl) {
    cli.warn(`Release v${release.version} has no release output available.`)
    return
  }

  // eslint-disable-next-line new-cap
  await output.Stream(streamUrl)
    .catch(error => {
      if (error.statusCode === 404 || error.response?.statusCode === 404) {
        cli.warn('Release command not started yet. Please try again in a few seconds.')
        return
      }

      throw error
    })
}

module.exports = {
  topic: 'releases',
  command: 'output',
  description: 'View the release command output',
  needsAuth: true,
  needsApp: true,
  args: [{name: 'release', optional: true}],
  run: cli.command({preauth: true}, run),
}
