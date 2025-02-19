import {Command, flags as Flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {App} from '../../lib/types/fir'
import color from '@heroku-cli/color'

import {BuildpackCommand} from '../../lib/buildpacks/buildpacks'
import {getGeneration} from '../../lib/apps/generation'

export default class Index extends Command {
  static description = 'list the buildpacks on an app'

  static flags = {
    app: Flags.app({required: true}),
    remote: Flags.remote(),
  }

  async run() {
    const {flags} = await this.parse(Index)
    const buildpacksCommand = new BuildpackCommand(this.heroku)
    const {body: app} = await this.heroku.get<App>(`/apps/${flags.app}`, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })
    const isFirApp = getGeneration(app) === 'fir'
    const buildpacks = await buildpacksCommand.fetch(flags.app, isFirApp)
    if (buildpacks.length === 0) {
      this.log(`${color.app(flags.app)} has no Buildpacks.`)
    } else {
      const pluralizedBuildpacks = buildpacks.length > 1 ? 'Buildpacks' : 'Buildpack'
      let header = `${color.app(flags.app)}`
      if (isFirApp) {
        header += ` Cloud Native ${pluralizedBuildpacks} (from the latest release OCI image)`
      } else {
        header += ` Classic ${pluralizedBuildpacks} (from buildpack registry)`
      }

      ux.styledHeader(header)
      buildpacksCommand.display(buildpacks, '')
    }
  }
}
