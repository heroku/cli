const cli = require('heroku-cli-util')
const Sanbashi = require('../lib/sanbashi')
const debug = require('../lib/debug')

let usage = `
    ${cli.color.bold.underline.magenta('Usage:')}
    ${cli.color.cmd('heroku container:run web bash')} # Runs bash on the local web docker container
    ${cli.color.cmd('heroku container:run worker')}   # Runs the container CMD on the local worker container`

module.exports = function (topic) {
  return {
    topic: topic,
    command: 'run',
    description: 'builds, then runs the docker image locally',
    needsApp: true,
    needsAuth: true,
    variableArgs: true,
    help: usage,
    flags: [
      {
        name: 'port',
        char: 'p',
        hasValue: true,
        description: 'port the app will run on'
      },
      {
        name: 'verbose',
        char: 'v',
        hasValue: false
      }
    ],
    run: cli.command(run)
  }
}

let run = async function (context, heroku) {
  if (context.flags.verbose) debug.enabled = true
  if (context.args.length === 0) {
    cli.exit(1, `Error: Requires one process type\n ${usage}`)
  }

  let processType = context.args.shift()
  let command = context.args

  let herokuHost = process.env.HEROKU_HOST || 'heroku.com'
  let registry = `registry.${herokuHost}`
  let dockerfiles = Sanbashi.getDockerfiles(process.cwd(), false)
  let possibleJobs = Sanbashi.getJobs(`${registry}/${context.app}`, dockerfiles)

  let jobs = []
  if (possibleJobs.standard) {
    possibleJobs.standard.forEach((pj) => { pj.resource = pj.resource.replace(/standard$/, processType) })
    jobs = possibleJobs.standard || []
  }
  if (!jobs.length) {
    cli.error('No images to run', 1)
    return
  }
  let job = jobs[0]

  if (command.length === 0) {
    cli.styledHeader(`Running ${job.resource}`)
  } else {
    cli.styledHeader(`Running '${command}' on ${job.resource}`)
  }
  try {
    await Sanbashi.runImage(job.resource, command, context.flags.port || 5000)
  } catch (err) {
    cli.exit(1, `Error: docker run exited with ${err}`)
  }
}
