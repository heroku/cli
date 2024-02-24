import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {debug} from '../../lib/container/debug'
import streamer from '../../lib/container/streamer'

const usage = `\n    ${color.bold.underline.magenta('Usage:')}\n    ${color.cyan.bold('heroku container:release web')}                       # Releases the previously pushed web process type\n    ${color.cyan.bold('heroku container:release web worker')}                # Releases the previously pushed web and worker process types`

export default class Release extends Command {
  static description = 'Releases previously pushed Docker images to your Heroku app'

  static flags = {
    app: flags.app({required: true}),
    verbose: flags.boolean({char: 'v'}),
  }

  async run(): Promise<void> {
    const {flags, argv, args} = await this.parse(Release)
    const {app, verbose} = flags
    if (verbose)
      debug.enabled = true
    if (args.length === 0) {
      ux.error(`Error: Requires one or more process types\n ${usage}`, {exit: 1})
      return
    }

    await this.heroku.get(`/apps/${app}`)
    const herokuHost = process.env.HEROKU_HOST || 'heroku.com'
    const updateData = []
    for (const process of args) {
      const image = `${app}/${process}`
      const tag = 'latest'
      const imageResp = await this.heroku.request({
        host: `registry.${herokuHost}`, path: `/v2/${image}/manifests/${tag}`, headers: {
          Accept: 'application/vnd.docker.distribution.manifest.v2+json',
        },
      })
      let imageID
      switch (imageResp.schemaVersion) {
      case 1:
        const v1Comp = JSON.parse(imageResp.history[0].v1Compatibility)
        imageID = v1Comp.id
        break
      case 2:
        imageID = imageResp.config.digest
        break
      }

      updateData.push({
        type: process, docker_image: imageID,
      })
    }

    const req = this.heroku.patch(`/apps/${app}/formation`, {
      body: {updates: updateData}, headers: {
        Accept: 'application/vnd.heroku+json; version=3.docker-releases',
      },
    })
    const oldRelease = await this.heroku.request({
      path: `/apps/${app}/releases`, partial: true, headers: {Range: 'version ..; max=2, order=desc'},
    })
      .then(releases => releases[0])
    await ux.action(`Releasing images ${args.join(',')} to ${app}`, req)
    const release = await this.heroku.request({
      path: `/apps/${app}/releases`, partial: true, headers: {Range: 'version ..; max=2, order=desc'},
    })
      .then(releases => releases[0])
    if ((!oldRelease && !release) || (oldRelease && (oldRelease.id === release.id))) {
      return
    }

    if (release.status === 'failed') {
      ux.error('Error: release command failed', {exit: 1})
    } else if ((release.status === 'pending') && release.output_stream_url) {
      ux.log('Running release command...')
      await streamer(release.output_stream_url, process.stdout)
      const finishedRelease = await this.heroku.request({
        path: `/apps/${app}/releases/${release.id}`,
      })
      if (finishedRelease.status === 'failed') {
        ux.error('Error: release command failed', {exit: 1})
      }
    }
  }
}
