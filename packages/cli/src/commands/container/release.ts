import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {debug} from '../../lib/container/debug'
import {streamer} from '../../lib/container/streamer'

type ImageResponse = {
  schemaVersion: number,
  history: [{
    v1Compatibility: string,
    }
  ],
  config: {
    digest: string
  }
}

export default class Release extends Command {
  static topic = 'container'
  static description = 'Releases previously pushed Docker images to your Heroku app'
  static usage = 'heroku container:release'
  static example = `
  ${color.cmd('heroku container:release web')}        # Releases the previously pushed web process type
  ${color.cmd('heroku container:release web worker')} # Releases the previously pushed web and worker process types`

  static strict = false

  static flags = {
    app: flags.app({required: true}),
    verbose: flags.boolean({char: 'v'}),
  }

  async run() {
    const {flags, argv, args} = await this.parse(Release)
    const {app, verbose} = flags

    if (argv.length === 0) {
      this.error(`Error: Requires one or more process types\n ${Release.example}`)
    }

    if (verbose) {
      debug.enabled = true
    }

    await this.heroku.get(`/apps/${app}`)

    const herokuHost: string = process.env.HEROKU_HOST || 'heroku.com'
    const updateData: any[] = []
    for (const process of argv) {
      const image = `${app}/${process}`
      const tag = 'latest'
      const {body: imageResp} = await this.heroku.get<ImageResponse>(
        `/v2/${image}/manifests/${tag}`,
        {
          hostname: `registry.${herokuHost}`,
          headers: {
            Accept: 'application/vnd.docker.distribution.manifest.v2+json',
          }},
      )
      let imageID
      let v1Comp
      switch (imageResp.schemaVersion) {
      case 1:
        v1Comp = JSON.parse(imageResp.history[0].v1Compatibility)
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

    ux.action.start(`Releasing images ${argv.join(',')} to ${app}`)
    await this.heroku.patch(`/apps/${app}/formation`, {
      body: {updates: updateData}, headers: {
        Accept: 'application/vnd.heroku+json; version=3.docker-releases',
      },
    })
    ux.action.stop()

    const {body: oldReleases} = await this.heroku.get<Heroku.Release[]>(`/apps/${app}/releases`, {
      partial: true, headers: {Range: 'version ..; max=2, order=desc'},
    })
    const oldRelease = oldReleases[0]

    const {body: updatedReleases} = await this.heroku.get<Heroku.Release[]>(`/apps/${app}/releases`, {
      partial: true, headers: {Range: 'version ..; max=1, order=desc'},
    })
    const release = updatedReleases[0]

    if ((!oldRelease && !release) || (oldRelease && (oldRelease.id === release.id))) {
      return
    }

    if (release.status === 'failed') {
      ux.error('Error: release command failed', {exit: 1})
    } else if ((release.status === 'pending') && release.output_stream_url) {
      ux.log('Running release command...')
      await streamer(release.output_stream_url, process.stdout)
      const {body: finishedRelease} = await this.heroku.request<Heroku.Release>(`/apps/${app}/releases/${release.id}`)
      if (finishedRelease.status === 'failed') {
        ux.error('Error: release command failed', {exit: 1})
      }
    }
  }
}
