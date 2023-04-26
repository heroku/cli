const cli = require('heroku-cli-util')
const Sanbashi = require('../lib/sanbashi')
const debug = require('../lib/debug')

module.exports = function (topic) {
  return {
    topic: topic,
    command: 'push',
    description: 'builds, then pushes Docker images to deploy your Heroku app',
    needsApp: true,
    needsAuth: true,
    variableArgs: true,
    examples: [
      `${cli.color.cmd('heroku container:push web')}                          # Pushes Dockerfile to web process type`,
      `${cli.color.cmd('heroku container:push worker')}                       # Pushes Dockerfile to worker process type`,
      `${cli.color.cmd('heroku container:push web worker --recursive')}       # Pushes Dockerfile.web and Dockerfile.worker`,
      `${cli.color.cmd('heroku container:push --recursive')}                  # Pushes Dockerfile.*`,
      `${cli.color.cmd('heroku container:push web --arg ENV=live,HTTPS=on')}  # Build-time variables`,
      `${cli.color.cmd('heroku container:push --recursive --context-path .')} # Pushes Dockerfile.* using current dir as build context`,
    ],
    flags: [
      {
        name: 'verbose',
        char: 'v',
        hasValue: false,
      },
      {
        name: 'recursive',
        char: 'R',
        hasValue: false,
        description: 'pushes Dockerfile.<process> found in current and subdirectories',
      },
      {
        name: 'arg',
        hasValue: true,
        description: 'set build-time variables',
      },
      {
        name: 'context-path',
        hasValue: true,
        description: 'path to use as build context (defaults to Dockerfile dir)',
      },
    ],
    run: cli.command(push),
  }
}

// eslint-disable-next-line complexity
let push = async function (context, heroku) {
  if (context.flags.verbose) debug.enabled = true
  const recurse = Boolean(context.flags.recursive)
  if (context.args.length === 0 && !recurse) {
    cli.exit(1, 'Error: Requires either --recursive or one or more process types')
    return
  }

  if (context.args.length > 1 && !recurse) {
    cli.exit(1, 'Error: Requires exactly one target process type, or --recursive option')
    return
  }

  await heroku.get(`/apps/${context.app}`)

  let herokuHost = process.env.HEROKU_HOST || 'heroku.com'
  let registry = `registry.${herokuHost}`
  let dockerfiles = Sanbashi.getDockerfiles(process.cwd(), recurse)

  let possibleJobs = Sanbashi.getJobs(`${registry}/${context.app}`, dockerfiles)
  let jobs = []
  if (recurse) {
    if (context.args.length > 0) {
      possibleJobs = Sanbashi.filterByProcessType(possibleJobs, context.args)
    }

    jobs = await Sanbashi.chooseJobs(possibleJobs)
  } else if (possibleJobs.standard) {
    possibleJobs.standard.forEach(pj => {
      pj.resource = pj.resource.replace(/standard$/, context.args[0])
    })
    jobs = possibleJobs.standard || []
  }

  if (jobs.length === 0) {
    cli.exit(1, 'No images to push')
    return
  }

  let flagsArg = context.flags.arg
  let buildArg = (flagsArg !== undefined) ? flagsArg.split(',') : []

  try {
    for (let job of jobs) {
      if (job.name === 'standard') {
        cli.styledHeader(`Building ${context.args} (${job.dockerfile})`)
      } else {
        cli.styledHeader(`Building ${job.name} (${job.dockerfile})`)
      }

      await Sanbashi.buildImage(job.dockerfile, job.resource, buildArg, context.flags['context-path'])
    }
  } catch (error) {
    cli.exit(1, `Error: docker build exited with ${error}`)
    return
  }

  try {
    for (let job of jobs) {
      if (job.name === 'standard') {
        cli.styledHeader(`Pushing ${context.args} (${job.dockerfile})`)
      } else {
        cli.styledHeader(`Pushing ${job.name} (${job.dockerfile})`)
      }

      await Sanbashi.pushImage(job.resource)
    }

    const plural = jobs.length !== 1
    cli.log(`Your image${plural ? 's have' : ' has'} been successfully pushed. You can now release ${plural ? 'them' : 'it'} with the 'container:release' command.`)
    warnThatReleaseIsRequired(plural)
  } catch (error) {
    cli.exit(1, `Error: docker push exited with ${error}`)
  }
}

function warnThatReleaseIsRequired(plural) {
  // TODO: delete this once this date has passed
  if (new Date() > new Date(2018, 8, 1)) return
  cli.warn(`${cli.color.cmd('heroku container:push')} no longer creates a release.\nRun ${cli.color.cmd('heroku container:release')} to create a release with ${plural ? 'these' : 'this'} image${plural ? 's' : ''}.`)
}
