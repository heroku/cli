import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import * as Heroku from '@heroku-cli/schema'
import {quote} from '../../lib/config/quote.js'
import {findByLatestOrId} from '../../lib/releases/releases.js'
import {description, color as getStatusColor} from '../../lib/releases/status_helper.js'

export default class Info extends Command {
  static topic = 'releases'
  static description = 'view detailed information for a release'
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
    shell: flags.boolean({char: 's', description: 'output in shell format'}),
    remote: flags.remote(),
    app: flags.app({required: true}),
  }

  static args = {
    release: Args.string({description: 'ID of the release. If omitted, we use the last release ID.'}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Info)
    const {json, shell, app} = flags
    const release = await findByLatestOrId(this.heroku, app, args.release)

    if (json) {
      hux.styledJSON(release)
    } else {
      let releaseChange = release.description
      const status = description(release)
      const statusColor = getStatusColor(release.status)
      const userEmail = release?.user?.email ?? ''
      const {body: config} = await this.heroku.get<Heroku.ConfigVars>(`/apps/${app}/releases/${release.version}/config-vars`)

      if (status) {
        let colorFn: (s: string) => string
        switch (statusColor) {
        case 'red': {
          colorFn = color.red
          break
        }
        case 'yellow': {
          colorFn = color.yellow
          break
        }
        case 'gray': {
          colorFn = color.gray
          break
        }
        default: {
          colorFn = color.cyan
        }
        }

        releaseChange += ' (' + colorFn(status) + ')'
      }

      hux.styledHeader(`Release ${color.cyan('v' + release.version)}`)
      hux.styledObject({
        'Add-ons': release.addon_plan_names,
        Change: releaseChange,
        By: userEmail,
        'Eligible for Rollback?': release.eligible_for_rollback ? 'Yes' : 'No',
        When: release.created_at,
      })
      ux.stdout()
      hux.styledHeader(`${color.cyan('v' + release.version)} Config vars`)
      if (shell) {
        Object.entries(config).forEach(([k, v]) => {
          ux.stdout(`${k}=${quote(v)}`)
        })
      } else {
        hux.styledObject(config)
      }
    }
  }
}

