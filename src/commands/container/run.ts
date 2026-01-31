import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

import {debug} from '../../lib/container/debug.js'
import {DockerHelper, DockerJob} from '../../lib/container/docker_helper.js'
import {ensureContainerStack} from '../../lib/container/helpers.js'

export default class Run extends Command {
  static description = 'builds, then runs the docker image locally'
  static examples = [
    `${color.command('heroku container:pull web')}        # Pulls the web image from the app`,
    `${color.command('heroku container:pull web worker')} # Pulls both the web and worker images from the app`,
    `${color.command('heroku container:pull web:latest')} # Pulls the latest tag from the web image`,
  ]

  static flags = {
    app: flags.app({required: true}),
    port: flags.integer({char: 'p', default: 5000, description: 'port the app will run on'}),
    remote: flags.remote(),
    verbose: flags.boolean({char: 'v'}),
  }

  static strict = false

  static topic = 'container'

  static usage = 'container:run -a APP [-v] PROCESS_TYPE...'

  dockerHelper = new DockerHelper()

  async run() {
    const {argv, flags} = await this.parse(Run)
    const {app, port, verbose} = flags

    if (argv.length === 0) {
      this.error(`Error: Requires one process type\n${Run.examples.join('\n')}`)
    }

    if (verbose) {
      debug.enabled = true
    }

    const {body: appBody} = await this.heroku.get<Heroku.App>(`/apps/${app}`)
    ensureContainerStack(appBody, 'run')

    const processType = argv.shift() as string
    const command: string = argv.join(' ')

    const herokuHost = process.env.HEROKU_HOST || 'heroku.com'
    const registry = `registry.${herokuHost}`
    const dockerfiles = this.dockerHelper.getDockerfiles(process.cwd(), false)
    const possibleJobs = this.dockerHelper.getJobs(`${registry}/${app}`, dockerfiles)

    let jobs: DockerJob[] = []

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
      hux.styledHeader(`Running ${job.resource}`)
    } else {
      hux.styledHeader(`Running '${color.code(command)}' on ${job.resource}`)
    }

    try {
      await this.dockerHelper.runImage(job.resource, command, port)
    } catch (error) {
      ux.error(`docker run exited with ${error}`)
    }
  }
}
