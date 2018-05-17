const cli = require('heroku-cli-util')
const debug = require('../lib/debug')
const Sanbashi = require('../lib/sanbashi')

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
        hasValue: false
      }
    ],
    run: cli.command(release)
  }
}

let release = async function (context, heroku) {
  if (context.flags.verbose) debug.enabled = true

  if (context.args.length === 0) {
    cli.error(`Error: Requires one or more process types\n ${usage} `, 1)
    return
  }
  await heroku.get(`/apps/${context.app}`)

  let herokuHost = process.env.HEROKU_HOST || 'heroku.com'
  let registry = `registry.${herokuHost}`

  let updateData = []
  for (let process of context.args) {
    let image = `${context.app}/${process}`
    let tag = 'latest'
    let imageID = await Sanbashi.imageID(`${registry}/${image}:${tag}`)

    if (imageID === undefined) {
      cli.error(`Cannot find local image ID for process type ${process}. Did you pull it?`)
      return
    }

    updateData.push({
      type: process,
      docker_image: imageID
    })
  }

  let req = heroku.patch(`/apps/${context.app}/formation`, {
    body: { updates: updateData },
    headers: {
      'Accept': 'application/vnd.heroku+json; version=3.docker-releases'
    }
  })
  await cli.action(`Releasing images ${context.args.join(',')} to ${context.app}`, req)

  let release = await heroku.request({
    path: `/apps/${context.app}/releases`,
    partial: true,
    headers: { 'Range': 'version ..; max=2, order=desc' }
  }).then((releases) => releases[0])

  if (release.output_stream_url) {
    cli.log('Running release command...')

    await new Promise(function (resolve, reject) {
      let stream = cli.got.stream(release.output_stream_url)
      stream.on('error', reject)
      stream.on('end', resolve)
      let piped = stream.pipe(process.stdout)
      piped.on('error', reject)
    }).catch(err => {
      if (err.statusCode === 404) {
        cli.warn('Release command starting. Use `heroku releases:output` to view the log.')
        return
      }
      throw err
    })
  }
}
