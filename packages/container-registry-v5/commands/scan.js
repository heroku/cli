const cli = require('heroku-cli-util')
const debug = require('../lib/debug')
const { spawn } = require('child_process')

let usage = `
    ${cli.color.bold.underline.magenta('Usage:')}
    ${cli.color.cmd('heroku container:scan web')}                       # Scans the previously pushed web process type
    ${cli.color.cmd('heroku container:scan web -j')}                    # Scans the previously pushed web process type and returns output in JSON
    ${cli.color.cmd('heroku container:scan web -t High')}               # Scans the previously pushed web process type and outputs vulnerabilitys rated High or greater`

module.exports = function (topic) {
  return {
    topic: topic,
    command: 'scan',
    description: 'Scans previously pushed Docker images to your Heroku app',
    needsApp: true,
    needsAuth: true,
    variableArgs: true,
    help: usage,
    flags: [
      {
        name: 'verbose',
        char: 'v',
        hasValue: false
      },
      {
        name: 'json',
        char: 'j',
        hasValue: false
      },
      {
        name: 'threshold',
        char: 't',
        hasValue: true,
        description: 'severity level threshold, vulnerabilities with severity level higher than or equal to this threshold will be outputted. Supported levels are Unknown, Negligible, Low, Medium, High, Critical, Defcon1'
      }
    ],
    run: cli.command(scan)
  }
}

let scan = async function (context, heroku) {
  if (context.flags.verbose) debug.enabled = true

  if (context.args.length === 0) {
    cli.error(`Error: Requires one or more process types\n ${usage} `, 1)
    return
  }
  await heroku.get(`/apps/${context.app}`)

  let herokuHost = process.env.HEROKU_HOST || 'heroku.com'

  let updateData = []
  for (let process of context.args) {
    let image = `${context.app}/${process}`
    let tag = 'latest'

    let imageResp = await heroku.request({
      host: `registry.${herokuHost}`,
      path: `/v2/${image}/manifests/${tag}`,
      headers: {
        Accept: 'application/vnd.docker.distribution.manifest.v2+json'
      }
    })

    let imageID
    switch (imageResp.schemaVersion) {
      case 1:
        let v1Comp = JSON.parse(imageResp.history[0].v1Compatibility)
        imageID = v1Comp.id
        break
      case 2:
        imageID = imageResp.config.digest
        break
    }

    updateData.push({
      type: process,
      docker_image: imageID
    })
  }

  let password = context.auth.password
  if (!password) throw new Error('not logged in')

  let threshold = context.flags.threshold || 'High'

  // Requires klar, install with go get -u github.com/optiopay/klar
  const klar = spawn('klar', [`registry.${herokuHost}/${context.app}/${context.args}`], {
    env: {
      DOCKER_USER: `_`,
      DOCKER_PASSWORD: password,
      CLAIR_ADDR: 'https://wschmitt-clair.herokuapp.com:443',
      CLAIR_OUTPUT: threshold,
      CLAIR_TIMEOUT: 2,
      DOCKER_TIMEOUT: 2,
      IGNORE_UNFIXED: true,
      JSON_OUTPUT: context.flags.json,
      PATH: process.env.PATH
    }
  })

  klar.stdout.on('data', (data) => {
    console.log(`${data}`)
  })

  klar.stderr.on('data', (data) => {
    console.log(`${data}`)
  })
}
