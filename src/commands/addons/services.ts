import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'

export default class Services extends Command {
  static description = 'list all available add-on services'
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
  }
  static topic = 'addons'

  public async run(): Promise<void> {
    const {flags} = await this.parse(Services)
    const {platform} = new HerokuSDK()
    const services = await platform.addOnService.list()
    if (flags.json) {
      hux.styledJSON(services)
    } else {
      /* eslint-disable perfectionist/sort-objects */
      hux.table(services as Array<Record<string, unknown>>, {
        name: {
          header: 'Slug',
        },
        human_name: {
          header: 'Name',
        },
        state: {
          header: 'State',
        },
      })
      /* eslint-enable perfectionist/sort-objects */
      ux.stdout(`\nSee plans with ${color.code('heroku addons:plans SERVICE')}`)
    }
  }
}
