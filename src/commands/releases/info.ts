import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'

import {quote} from '../../lib/config/quote.js'
import {findByLatestOrId} from '../../lib/releases/releases.js'
import {description, color as getStatusColor} from '../../lib/releases/status-helper.js'

export default class Info extends Command {
  static args = {
    release: Args.string({description: 'ID of the release. If omitted, we use the last release ID.'}),
  }
  static description = 'view detailed information for a release'
  static flags = {
    app: flags.app({required: true}),
    json: flags.boolean({description: 'output in json format'}),
    remote: flags.remote(),
    shell: flags.boolean({char: 's', description: 'output in shell format'}),
  }
  static topic = 'releases'

  public async run(): Promise<void> {
    const {platform} = new HerokuSDK()
    const {args, flags} = await this.parse(Info)
    const {app, json, shell} = flags
    const release = await findByLatestOrId(platform, app, args.release)

    if (json) {
      hux.styledJSON(release)
    } else {
      let releaseChange = release.description
      const status = description(release)
      const statusColor = getStatusColor(release.status)
      const userEmail = color.user(release?.user?.email ?? '')
      const config = await platform.configVar.infoForAppRelease(app, release.version)

      if (status) {
        let colorFn: (s: string) => string
        switch (statusColor) {
          case 'gray': {
            colorFn = color.inactive
            break
          }

          case 'red': {
            colorFn = color.failure
            break
          }

          case 'yellow': {
            colorFn = color.warning
            break
          }

          default: {
            colorFn = color.info
          }
        }

        releaseChange += ' (' + colorFn(status) + ')'
      }

      hux.styledHeader(`Release ${color.name('v' + release.version)}`)
      hux.styledObject({
        'Add-ons': release.addon_plan_names,
        By: userEmail,
        Change: releaseChange,
        'Eligible for Rollback?': release.eligible_for_rollback ? 'Yes' : 'No',
        When: release.created_at,
      })
      ux.stdout()
      hux.styledHeader(`${color.name('v' + release.version)} Config vars`)
      if (shell) {
        for (const [k, v] of Object.entries(config)) {
          ux.stdout(`${k}=${quote(v)}`)
        }
      } else {
        hux.styledObject(config)
      }
    }
  }
}
