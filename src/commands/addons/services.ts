import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import * as hux from '@heroku/heroku-cli-util/hux'
import {ux} from '@oclif/core'

export default class Services extends Command {
  static description = 'list all available add-on services'
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
  }

  static topic = 'addons'

  public async run(): Promise<void> {
    const {flags} = await this.parse(Services)
    const {body: services} = await this.heroku.get<Heroku.AddOnService[]>('/addon-services')
    if (flags.json) {
      hux.styledJSON(services)
    } else {
      /* eslint-disable perfectionist/sort-objects */
      hux.table(services, {
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
