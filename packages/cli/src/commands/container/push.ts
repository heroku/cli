/*
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import {DockerHelper, GroupedDockerJobs, DockerJob} from '../../lib/container/docker_helper.js'
import {ensureContainerStack} from '../../lib/container/helpers.js'
import {debug} from '../../lib/container/debug.js'
import * as Heroku from '@heroku-cli/schema'

export default class Push extends Command {
  static topic = 'container'
  static description = 'builds, then pushes Docker images to deploy your Heroku app'
  static strict = false
  static flags = {
    app: flags.app({required: true}),
    verbose: flags.boolean({char: 'v'}),
    recursive: flags.boolean({char: 'R', description: 'pushes Dockerfile.<process> found in current and subdirectories'}),
    arg: flags.string({description: 'set build-time variables'}),
    'context-path': flags.string({description: 'path to use as build context (defaults to Dockerfile dir)'}),
    remote: flags.remote({char: 'r'}),
  }

  static examples = [
    '$ heroku container:push web                          # Pushes Dockerfile to web process type',
    '$ heroku container:push worker                       # Pushes Dockerfile to worker process type',
    '$ heroku container:push web worker --recursive       # Pushes Dockerfile.web and Dockerfile.worker',
    '$ heroku container:push --recursive                  # Pushes Dockerfile.*',
    '$ heroku container:push web --arg ENV=live,HTTPS=on  # Build-time variables',
    '$ heroku container:push --recursive --context-path . # Pushes Dockerfile.* using current dir as build context',
  ]

  dockerHelper = new DockerHelper()

  async run(): Promise<void> {
    const {argv: processTypes, flags} = await this.parse(Push)
    const {verbose, app, recursive, arg, 'context-path': contextPath} = flags

    if (verbose) {
      debug.enabled = true
    }

    if (processTypes.length === 0 && !recursive) {
      ux.error('Requires either --recursive or one or more process types', {exit: 1})
    }

    if (processTypes.length > 1 && !recursive) {
      ux.error('Requires exactly one target process type, or --recursive option', {exit: 1})
    }

    const {body: appBody} = await this.heroku.get<Heroku.App>(`/apps/${app}`)
    ensureContainerStack(appBody, 'push')

    const herokuHost = process.env.HEROKU_HOST || 'heroku.com'
    const registry = `registry.${herokuHost}`
    const dockerfiles = this.dockerHelper.getDockerfiles(process.cwd(), recursive)
    const possibleJobs = this.dockerHelper.getJobs(`${registry}/${app}`, dockerfiles)
    const jobs = await this.selectJobs(possibleJobs, processTypes as string[], recursive)

    if (jobs.length === 0) {
      ux.error('No images to push', {exit: 1})
    }

    const buildArgs = (arg === undefined) ? [] : arg.split(',')

    try {
      for (const job of jobs) {
        if (job.name === 'standard') {
          hux.styledHeader(`Building ${processTypes} (${job.dockerfile})`)
        } else {
          hux.styledHeader(`Building ${job.name} (${job.dockerfile})`)
        }

        await this.dockerHelper.buildImage({
          dockerfile: job.dockerfile,
          resource: job.resource,
          buildArgs,
          path: contextPath,
          arch: this.config.arch,
        })
      }
    } catch (error) {
      ux.error(`docker build exited with ${error}`, {exit: 1})
    }

    try {
      for (const job of jobs) {
        if (job.name === 'standard') {
          hux.styledHeader(`Pushing ${processTypes} (${job.dockerfile})`)
        } else {
          hux.styledHeader(`Pushing ${job.name} (${job.dockerfile})`)
        }

        await this.dockerHelper.pushImage(job.resource)
      }

      const plural = jobs.length !== 1
      ux.stdout(`Your image${plural ? 's have' : ' has'} been successfully pushed. You can now release ${plural ? 'them' : 'it'} with the 'container:release' command.`)
    } catch (error) {
      ux.error(`docker push exited with ${error}`, {exit: 1})
    }
  }

  async selectJobs(jobs: GroupedDockerJobs, processTypes: string[], recursive: boolean) {
    let filteredJobs: GroupedDockerJobs = {}
    let selectedJobs: DockerJob[] = []

    if (Object.keys(jobs).length === 0) {
      return selectedJobs
    }

    if (recursive) {
      if (processTypes.length > 0) {
        filteredJobs = this.dockerHelper.filterByProcessType(jobs, processTypes)
      } else {
        filteredJobs = jobs
      }

      selectedJobs = await this.dockerHelper.chooseJobs(filteredJobs)
    } else if (jobs.standard) {
      jobs.standard.forEach(pj => {
        pj.resource = pj.resource.replace(/standard$/, processTypes[0])
      })
      selectedJobs = jobs.standard || []
    }

    return selectedJobs
  }
}
*/
