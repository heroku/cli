import {Command, flags} from '@heroku-cli/command'
import {Plan} from '@heroku-cli/schema'
import {hux} from '@heroku/heroku-cli-util'
import {Args} from '@oclif/core'
import _ from 'lodash'
import printf from 'printf'

import {formatPrice} from '../../lib/addons/util.js'

type PlanWithMeteredPrice = Plan & {
  price: {
    cents?: number
    contract?: boolean
    metered?: boolean
    unit?: string
  }
}

export default class Plans extends Command {
  static args = {
    service: Args.string({description: 'unique identifier or globally unique name of the add-on', required: true}),
  }

  static description = 'list all available plans for an add-on service'
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
  }

  static topic = 'addons'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Plans)
    const {service} = args
    let {body: plans} = await this.heroku.get<PlanWithMeteredPrice[]>(`/addon-services/${service}/plans`, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })
    plans = _.sortBy(plans, ['price.contract', 'price.cents'])
    if (flags.json) {
      hux.styledJSON(plans)
    } else {
      /* eslint-disable perfectionist/sort-objects */
      hux.table(plans, {
        default: {
          get: (plan: any) => plan.default ? 'default' : '',
          header: ' ', // <- This space is necessary to prevent the table header from rendering as "default"
        },
        name: {
          header: 'Slug',
        },
        human_name: {
          header: 'Name',
        },
        price: {
          get: (plan: any) => formatPrice({hourly: true, price: plan.price}),
          header: 'Price',
        },
        max_price: {
          get: (plan: any) => plan.price.metered ? this.printMeteredPricingURL(service) : formatPrice({hourly: false, price: plan.price}),
          header: 'Max Price',
        },
      })
      /* eslint-enable perfectionist/sort-objects */
    }
  }

  private printMeteredPricingURL(service: string): any {
    return printf(`https://elements.heroku.com/addons/${service}#pricing`)
  }
}
