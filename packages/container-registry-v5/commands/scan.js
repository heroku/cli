const cli = require('heroku-cli-util')
const debug = require('../lib/debug')
const { spawn } = require('child_process')

let usage = `
    ${cli.color.bold.underline.magenta('Usage:')}
    ${cli.color.cmd('heroku container:scan web')}                       # Scans the previously pushed web process type`

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
    console.log(`password: ${password}`)

    let klarConfig = {
      DOCKER_USER: `_`,
      DOCKER_PASSWORD: password,
      CLAIR_ADDR: "https://wschmitt-clair.herokuapp.com:443",
      CLAIR_OUTPUT: "High",
      CLAIR_THRESHOLD: "10",
      PATH: process.env.PATH,
    }

    let image = `${context.app}/web`
    let fullDockerImageURL = `registry.heroku.com/${image}`
    console.log(fullDockerImageURL)

    const klar = spawn('klar', [`${fullDockerImageURL}`], {
      env: klarConfig,
    })

    klar.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    klar.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });

    klar.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });
}
