import {Command, flags, vars} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {containerExtensions} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core/ux'

import {debug} from '../../lib/container/debug.js'
import {ensureContainerStack} from '../../lib/container/helpers.js'
import {streamer} from '../../lib/container/streamer.js'

type ImageResponse = {
  config: {digest: string}
  history: [{v1Compatibility: string}],
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
    const {platform} = new HerokuSDK({extensions: [containerExtensions]})
    const {argv, flags} = await this.parse(ContainerRelease)
    const {app, verbose} = flags

    if (argv.length === 0) {
      this.error(`Error: Requires one or more process types\n ${ContainerRelease.examples.join('\n')}`)
    }

    if (verbose) {
      debug.enabled = true
    }

    await ensureContainerStack(platform, app, 'release')

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
          hostname: `registry.${vars.host}`,
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

    ux.action.start(`Releasing images ${argv.join(',')} to ${app}`)
    const {newRelease: release, oldRelease} = await platform.container.releaseImages(app, updateData)
    ux.action.stop()

    if (!release || (oldRelease?.id === release.id)) {
      return
    }

    if (release.status === 'failed') {
      ux.error('Error: release command failed', {exit: 1})
    } else if ((release.status === 'pending') && release.output_stream_url) {
      ux.stdout('Running release command...')
      await streamer(release.output_stream_url, process.stdout)
      const finishedRelease = await platform.release.info(app, release.id)
      if (finishedRelease.status === 'failed') {
        ux.error('Error: release command failed', {exit: 1})
      }
    }
  }
}
