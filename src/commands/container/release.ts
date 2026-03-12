import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

import {debug} from '../../lib/container/debug.js'
import {ensureContainerStack} from '../../lib/container/helpers.js'
import {streamer} from '../../lib/container/streamer.js'

type ImageResponse = {
  config: {
    digest: string
  }
  history: [{
    v1Compatibility: string,
    }
  ],
  schemaVersion: number,
}

export default class ContainerRelease extends Command {
  static description = 'Releases previously pushed Docker images to your Heroku app'
  static examples = [
    `${color.command('heroku container:release web')}        # Releases the previously pushed web process type`,
    `${color.command('heroku container:release web worker')} # Releases the previously pushed web and worker process types`,
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    verbose: flags.boolean({char: 'v'}),
  }

  static strict = false

  static topic = 'container'

  static usage = 'container:release'

  async run() {
    const {argv, flags} = await this.parse(ContainerRelease)
    const {app, verbose} = flags

    if (argv.length === 0) {
      this.error(`Error: Requires one or more process types\n ${ContainerRelease.examples.join('\n')}`)
    }

    if (verbose) {
      debug.enabled = true
    }

    const {body: appBody} = await this.heroku.get<Heroku.App>(`/apps/${app}`)
    ensureContainerStack(appBody, 'release')

    const herokuHost: string = process.env.HEROKU_HOST || 'heroku.com'
    const updateData: any[] = []
    for (const process of argv) {
      const image = `${app}/${process}`
      const tag = 'latest'
      const {body: imageResp} = await this.heroku.get<ImageResponse>(
        `/v2/${image}/manifests/${tag}`,
        {
          headers: {
            Accept: 'application/vnd.docker.distribution.manifest.v2+json',
            Authorization: `Basic ${Buffer.from(`:${this.heroku.auth}`).toString('base64')}`,
          },
          hostname: `registry.${herokuHost}`,
        },
      )
      let imageID
      let v1Comp
      switch (imageResp.schemaVersion) {
      case 1: {
        v1Comp = JSON.parse(imageResp.history[0].v1Compatibility)
        imageID = v1Comp.id
        break
      }

      case 2: {
        imageID = imageResp.config.digest
        break
      }
      }

      updateData.push({
        docker_image: imageID, type: process,
      })
    }

    const {body: oldReleases} = await this.heroku.get<Heroku.Release[]>(`/apps/${app}/releases`, {
      headers: {Range: 'version ..; max=1, order=desc'}, partial: true,
    })
    const oldRelease = oldReleases[0]

    ux.action.start(`Releasing images ${argv.join(',')} to ${app}`)
    await this.heroku.patch(`/apps/${app}/formation`, {
      body: {updates: updateData}, headers: {
        Accept: 'application/vnd.heroku+json; version=3.docker-releases',
      },
    })
    ux.action.stop()

    const {body: updatedReleases} = await this.heroku.get<Heroku.Release[]>(`/apps/${app}/releases`, {
      headers: {Range: 'version ..; max=1, order=desc'}, partial: true,
    })
    const release = updatedReleases[0]

    if ((!oldRelease && !release) || (oldRelease && (oldRelease.id === release.id))) {
      return
    }

    if (release.status === 'failed') {
      ux.error('Error: release command failed', {exit: 1})
    } else if ((release.status === 'pending') && release.output_stream_url) {
      ux.stdout('Running release command...')
      await streamer(release.output_stream_url, process.stdout)
      const {body: finishedRelease} = await this.heroku.request<Heroku.Release>(`/apps/${app}/releases/${release.id}`)
      if (finishedRelease.status === 'failed') {
        ux.error('Error: release command failed', {exit: 1})
      }
    }
  }
}
