const cli = require('heroku-cli-util')
const debug = require('../lib/debug')
const streamer = require('../lib/streamer')
const helpers = require('../lib/helpers')

let usage = `
    ${cli.color.bold.underline.magenta('Usage:')}
    ${cli.color.cmd('heroku container:release web')}                       # Releases the previously pushed web process type
    ${cli.color.cmd('heroku container:release web worker')}                # Releases the previously pushed web and worker process types`

module.exports = function (topic) {
  return {
    topic: topic,
    command: 'release',
    description: 'Releases previously pushed Docker images to your Heroku app',
    needsApp: true,
    needsAuth: true,
    variableArgs: true,
    help: usage,
    flags: [
      {
        name: 'verbose',
        char: 'v',
        hasValue: false,
      },
    ],
    run: cli.command(release),
  }
}

let release = async function (context, heroku) {
  if (context.flags.verbose) debug.enabled = true

  if (context.args.length === 0) {
    cli.exit(1, `Error: Requires one or more process types\n ${usage}`)
    return
  }

  let app = await heroku.get(`/apps/${context.app}`)
  helpers.ensureContainerStack(app, 'release')

  let herokuHost = process.env.HEROKU_HOST || 'heroku.com'

  let updateData = []
  for (let process of context.args) {
    let image = `${context.app}/${process}`
    let tag = 'latest'

    let imageResp = await heroku.request({
      host: `registry.${herokuHost}`,
      path: `/v2/${image}/manifests/${tag}`,
      headers: {
        Accept: 'application/vnd.docker.distribution.manifest.v2+json',
      },
    })

    let imageID
    switch (imageResp.schemaVersion) {
    case 1:
      // eslint-disable-next-line no-case-declarations
      let v1Comp = JSON.parse(imageResp.history[0].v1Compatibility)
      imageID = v1Comp.id
      break
    case 2:
      imageID = imageResp.config.digest
      break
    }

    updateData.push({
      type: process,
      docker_image: imageID,
    })
  }

  let req = heroku.patch(`/apps/${context.app}/formation`, {
    body: {updates: updateData},
    headers: {
      Accept: 'application/vnd.heroku+json; version=3.docker-releases',
    },
  })

  let oldRelease = await heroku.request({
    path: `/apps/${context.app}/releases`,
    partial: true,
    headers: {Range: 'version ..; max=2, order=desc'},
  }).then(releases => releases[0])

  await cli.action(`Releasing images ${context.args.join(',')} to ${context.app}`, req)

  let release = await heroku.request({
    path: `/apps/${context.app}/releases`,
    partial: true,
    headers: {Range: 'version ..; max=2, order=desc'},
  }).then(releases => releases[0])

  if ((!oldRelease && !release) || (oldRelease && (oldRelease.id === release.id))) {
    return
  }

  if (release.status === 'failed') {
    cli.exit(1, 'Error: release command failed')
  } else if ((release.status === 'pending') && release.output_stream_url) {
    cli.log('Running release command...')
    await streamer(release.output_stream_url, process.stdout)

    let finishedRelease = await heroku.request({
      path: `/apps/${context.app}/releases/${release.id}`,
    })

    if (finishedRelease.status === 'failed') {
      cli.exit(1, 'Error: release command failed')
    }
  }
}
