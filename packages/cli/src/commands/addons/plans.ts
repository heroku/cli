import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {formatPrice} from '../../lib/addons/util'
import * as _ from 'lodash'
import {Plan} from '@heroku-cli/schema'
import printf = require('printf')

type PlanWithMeteredPrice = Plan & {
  price: {
    cents?: number
    contract?: boolean
    unit?: string
    metered?: boolean
  }
}

export default class Plans extends Command {
  static topic = 'addons';
  static description = 'list all available plans for an add-on service';
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
  }

  static args = {
    service: Args.string({required: true, description: 'unique identifier or globally unique name of the add-on'}),
  }

  private printMeteredPricingURL(service: string): any {
    return printf(`https://elements.heroku.com/addons/${service}#pricing`)
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Plans)
    const {service} = args
    let {body: plans} = await this.heroku.get<PlanWithMeteredPrice[]>(`/addon-services/${service}/plans`, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })
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
          header: 'Slug',
        },
        human_name: {
          header: 'Name',
        },
        price: {
          header: 'Price',
          get: (plan: any) => formatPrice({price: plan.price, hourly: true}),
        },
        max_price: {
          header: 'Max price',
          get: (plan: any) => plan.price.metered ? this.printMeteredPricingURL(service) : formatPrice({price: plan.price, hourly: false}),
        },
      })
    }
  }
}
