'use strict'

let cli = require('@heroku/heroku-cli-util')
let releases = require('../../releases')
let output = require('../../output')

async function run(context, heroku) {
  let release
  if (context.args.release) {
    let id = context.args.release.toLowerCase()
    id = id.startsWith('v') ? id.slice(1) : id
    release = await heroku.get(`/apps/${context.app}/releases/${id}`)
  } else {
    // eslint-disable-next-line new-cap
    release = await releases.FindRelease(heroku, context.app, releases => releases.filter(r => r.status === 'succeeded')[1])
  }

  let latest
  await cli.action(`Rolling back ${cli.color.app(context.app)} to ${cli.color.green('v' + release.version)}`, {success: false}, (async function () {
    latest = await heroku.post(`/apps/${context.app}/releases`, {body: {release: release.id}})

    cli.action.done(`done, ${cli.color.green('v' + latest.version)}`)
    cli.warn(`Rollback affects code and config vars; it doesn't add or remove addons.
To undo, run: ${cli.color.cmd('heroku rollback v' + (latest.version - 1))}`)
  })())

  if (latest.output_stream_url) {
    cli.log('Running release command...')
    // eslint-disable-next-line new-cap
    await output.Stream(latest.output_stream_url)
      .catch(error => {
        if (error.statusCode === 404 || error.response?.statusCode === 404) {
          cli.warn('Release command starting. Use `heroku releases:output` to view the log.')
          return
        }

        throw error
      })
  }
}

let cmd = {
  description: 'rollback to a previous release',
  help: 'If RELEASE is not specified, it will rollback one release',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'release', optional: true}],
  run: cli.command({preauth: true}, run),
}

module.exports = [
  Object.assign({topic: 'releases', command: 'rollback'}, cmd),
  Object.assign({hidden: true, topic: 'rollback'}, cmd),
]
