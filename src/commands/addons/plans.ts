import {Command, flags} from '@heroku-cli/command'
import {Plan} from '@heroku-cli/schema'
import {hux} from '@heroku/heroku-cli-util'
import {addOnExtensions} from '@heroku/sdk/extensions/platform'
import {HerokuSDK} from '@heroku/sdk/sdk'
import {Args} from '@oclif/core'
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
    const {platform} = new HerokuSDK({extensions: [addOnExtensions]})
    const plans = ((await platform.addOn.listPlans(service)) as unknown as PlanWithMeteredPrice[])
      .sort((a, b) => {
        const contractDelta = Number(a.price?.contract ?? false) - Number(b.price?.contract ?? false)
        if (contractDelta !== 0) return contractDelta
        return (a.price?.cents ?? 0) - (b.price?.cents ?? 0)
      })
    if (flags.json) {
      hux.styledJSON(plans)
    } else {
      /* eslint-disable perfectionist/sort-objects */
      hux.table(plans, {
        default: {
          header: ' ', // <- This space is necessary to prevent the table header from rendering as "default"
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
          header: 'Max Price',
          get: (plan: any) => plan.price.metered ? this.printMeteredPricingURL(service) : formatPrice({price: plan.price, hourly: false}),
        },
      })
      /* eslint-enable perfectionist/sort-objects */
    }
  }

  private printMeteredPricingURL(service: string): any {
    return printf(`https://elements.heroku.com/addons/${service}#pricing`)
  }
}
