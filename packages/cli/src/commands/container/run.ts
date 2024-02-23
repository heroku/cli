import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as DockerHelper from '../../lib/container/docker_helper'
import {debug} from '../../lib/container/debug'
import color from '@heroku-cli/color'

export default class Run extends Command {
  static topic = 'container'
  static description = 'builds, then runs the docker image locally'
  static usage = '$ heroku container:pull -a APP [-v] PROCESS_TYPE...'
  static example = `
  ${color.cmd('$ heroku container:pull web')}        # Pulls the web image from the app
  ${color.cmd('$ heroku container:pull web worker')} # Pulls both the web and worker images from the app
  ${color.cmd('$ heroku container:pull web:latest')} # Pulls the latest tag from the web image`

  static strict = false

  static flags = {
    app: flags.app({required: true}),
    port: flags.integer({char: 'p', description: 'port the app will run on', default: 5000}),
    verbose: flags.boolean({char: 'v'}),
  }

  async run() {
    const {argv, flags} = await this.parse(Run)
    const {verbose, app, port} = flags

    if (argv.length === 0) {
      this.error(`Error: Requires one process type\n${Run.example}`)
    }

    if (verbose) {
      debug.enabled = true
    }

    const processType = argv.shift() as string
    const command: string = argv.join(' ')

    const herokuHost = process.env.HEROKU_HOST || 'heroku.com'
    const registry = `registry.${herokuHost}`
    const dockerfiles = DockerHelper.getDockerfiles(process.cwd(), false)
    const possibleJobs = DockerHelper.getJobs(`${registry}/${app}`, dockerfiles)

    let jobs = []

    if (possibleJobs.standard) {
      possibleJobs.standard.forEach((pj: { resource: string }) => {
        pj.resource = pj.resource.replace(/standard$/, processType)
      })
      jobs = possibleJobs.standard || []
    }

    if (jobs.length === 0) {
      ux.error('No images to run')
    }

    const job = jobs[0]

    if (command.length === 0) {
      ux.styledHeader(`Running ${job.resource}`)
    } else {
      ux.styledHeader(`Running '${command}' on ${job.resource}`)
    }

    try {
      await DockerHelper.runImage(job.resource, command, port)
    } catch (error) {
      ux.error(`docker run exited with ${error}`)
    }
  }
}
