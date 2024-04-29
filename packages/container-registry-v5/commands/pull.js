const cli = require('heroku-cli-util')

const Sanbashi = require('../lib/sanbashi')
const debug = require('../lib/debug')
const helpers = require('../lib/helpers')

let usage = `
    ${cli.color.bold.underline.magenta('Usage:')}
    ${cli.color.cmd('heroku container:pull web')}        # Pulls the web image from the app
    ${cli.color.cmd('heroku container:pull web worker')} # Pulls both the web and worker images from the app
    ${cli.color.cmd('heroku container:pull web:latest')} # Pulls the latest tag from the web image`

let pull = async function (context, heroku) {
  if (context.flags.verbose) debug.enabled = true

  if (context.args.length === 0) {
    cli.exit(1, `Error: Requires one or more process types\n ${usage}`)
  }

  let app = await heroku.get(`/apps/${context.app}`)
  helpers.ensureContainerStack(app, 'pull')

  let herokuHost = process.env.HEROKU_HOST || 'heroku.com'
  let registry = `registry.${herokuHost}`

  for (let process of context.args) {
    let tag = `${registry}/${context.app}/${process}`
    cli.styledHeader(`Pulling ${process} as ${tag}`)
    await Sanbashi.pullImage(tag)
  }
}

module.exports = function (topic) {
  return {
    topic: topic,
    command: 'pull',
    description: 'pulls an image from an app\'s process type',
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
    run: cli.command(pull),
  }
}
