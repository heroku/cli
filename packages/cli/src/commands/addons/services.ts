import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

export default class Services extends Command {
    static topic = 'addons';
    static description = 'list all available add-on services';
    static flags = {
      json: flags.boolean({description: 'output in json format'}),
    };

    public async run(): Promise<void> {
      const {flags} = await this.parse(Services)
      const {body: services} = await this.heroku.get<Heroku.AddOnService[]>('/addon-services')
      if (flags.json) {
        ux.styledJSON(services)
      } else {
        ux.table(services, {
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
        ux.log(`\nSee plans with ${color.blue('heroku addons:plans SERVICE')}`)
      }
    }
}
