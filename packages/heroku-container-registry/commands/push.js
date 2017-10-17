const cli = require('heroku-cli-util')
const Sanbashi = require('../lib/sanbashi')

let usage = `
    ${ cli.color.bold.underline.magenta('Usage:')}
    ${ cli.color.cmd('heroku container:push web')}                          # Pushes Dockerfile to web process type
    ${ cli.color.cmd('heroku container:push web worker --recursive')}       # Pushes Dockerfile.web and Dockerfile.worker
    ${ cli.color.cmd('heroku container:push --recursive')}                  # Pushes Dockerfile.*
    ${ cli.color.cmd('heroku container:push web --arg ENV=live,HTTPS=on')}  # Build-time variables`

module.exports = function (topic) {
  return {
    topic: topic,
    command: 'push',
    description: 'builds, then pushes Docker images to deploy your Heroku app',
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
        name: 'recursive',
        char: 'R',
        hasValue: false,
        description: 'pushes Dockerfile.<process> found in current and subdirectories'
      },
      {
        name: 'arg',
        hasValue: true,
        description: 'set build-time variables'
      }
    ],
    run: cli.command(push)
  }
}

let push = async function (context, heroku) {
  const recurse = !!context.flags.recursive
  if (context.args.length === 0 && !recurse) {
    cli.error(`Error: Requires either --recursive or one or more process types\n ${usage} `)
    process.exit(1)
  }
  if (context.args.length > 1 && !recurse) {
    cli.error(`Error: Please specify one target process type\n ${usage} `)
    process.exit(1)
  }
  let herokuHost = process.env.HEROKU_HOST || 'heroku.com'
  let registry = `registry.${ herokuHost }`
  let dockerfiles = Sanbashi.getDockerfiles(process.cwd(), recurse)

  let possibleJobs = Sanbashi.getJobs(`${ registry }/${ context.app }`, dockerfiles)
  let jobs = []
  if (recurse) {
    if (context.args.length) {
      possibleJobs = Sanbashi.filterByProcessType(possibleJobs, context.args)
    }
    jobs = await Sanbashi.chooseJobs(possibleJobs)
  } else if (possibleJobs.standard) {
    possibleJobs.standard.forEach((pj) => { pj.resource = pj.resource.replace(/standard$/, context.args[0])})
    jobs = possibleJobs.standard || []
  }
  if (!jobs.length) {
    cli.warn('No images to push')
    process.exit(1)
  }

  let flagsArg = context.flags.arg;
  let buildArg = (flagsArg !== undefined) ? flagsArg.split(',') : []

  try {
    for (let job of jobs) {
      if (job.name === 'standard') {
        cli.styledHeader(`Building ${context.args} (${job.dockerfile })`)
      } else {
        cli.styledHeader(`Building ${job.name} (${job.dockerfile})`)
      }
      await Sanbashi.buildImage(job.dockerfile, job.resource, context.flags.verbose, buildArg)
    }
  }
  catch (err) {
    cli.error(`Error: docker build exited with ${ err }`)
    cli.hush(err.stack || err)
    process.exit(1)
  }

  try {
    for (let job of jobs) {
      if (job.name === 'standard') {
        cli.styledHeader(`Pushing ${context.args} (${job.dockerfile })`)
      } else {
        cli.styledHeader(`Pushing ${job.name} (${job.dockerfile })`)
      }
      await Sanbashi.pushImage(job.resource, context.flags.verbose)
    }
  }
  catch (err) {
    cli.error(`Error: docker push exited with ${ err }`)
    cli.hush(err.stack || err)
    process.exit(1)
  }
}
