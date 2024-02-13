import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {formatPrice} from '../../lib/addons/util'
import * as _ from 'lodash'
import * as Heroku from '@heroku-cli/schema'

export default class Plans extends Command {
    static topic = 'addons';
    static description = 'list all available plans for an add-on service';
    static flags = {
      json: flags.boolean({description: 'output in json format'}),
    };

    static args = {
      service: Args.string({required: true}),
    };

    public async run(): Promise<void> {
      const {flags, args} = await this.parse(Plans)
      let {body: plans} = await this.heroku.get<Heroku.Plan[]>(`/addon-services/${args.service}/plans`)
      plans = _.sortBy(plans, ['price.contract', 'price.cents'])
      if (flags.json) {
        ux.styledJSON(plans)
      } else {
        ux.table(plans, {
          default: {
            header: '',
            get: (plan: any) => plan.default ? 'default' : '',
          },
          name: {
            header: 'slug',
          },
          human_name: {
            header: 'name',
          },
          price: {
            header: 'price',
            get: (plan: any) => formatPrice({price: plan.price, hourly: true}),
          },
          max_price: {
            header: 'max price',
            get: (plan: any) => formatPrice({price: plan.price, hourly: false}),
          },
        })
      }
    }
}
