import type {AddOn, Plan} from '@heroku-cli/schema'

import {color} from '@heroku/heroku-cli-util'
import {HTTP} from '@heroku/http-call'
import {Command, flags} from '@heroku-cli/command'
import {HerokuAPIError} from '@heroku-cli/command/lib/api-client.js'
import {Args, ux} from '@oclif/core'

import type {ExtendedAddon} from '../../lib/pg/types.js'

import {addonResolver} from '../../lib/addons/resolve.js'
import {formatPriceText} from '../../lib/addons/util.js'

export default class Upgrade extends Command {
  static aliases = ['addons:downgrade']
  static args = {
    addon: Args.string({description: 'unique identifier or globally unique name of the add-on', required: true}),
    plan: Args.string({description: 'unique identifier or name of the plan'}),
  }

  static description = `change add-on plan.
  See available plans with \`heroku addons:plans SERVICE\`.

  Note that \`heroku addons:upgrade\` and \`heroku addons:downgrade\` are the same.\
  Either one can be used to change an add-on plan up or down.

  https://devcenter.heroku.com/articles/managing-add-ons
  `
  static examples = ['Upgrade an add-on by service name:\n$ heroku addons:upgrade heroku-redis:premium-2\n\nUpgrade a specific add-on:\n$ heroku addons:upgrade swimming-briskly-123 heroku-redis:premium-2']
  static flags = {
    app: flags.app(),
    remote: flags.remote(),
  }

  static topic = 'addons'

  protected buildApiErrorMessage(errorMessage: string, ctx: any) {
    const {args: {addon, plan}, flags: {app}} = ctx
    const example = errorMessage.split(', ')[2] || 'redis-triangular-1234'
    return `${errorMessage}

Multiple add-ons match ${color.addon(addon)}${app ? ' on ' + color.app(app) : ''}
It is not clear which add-on's plan you are trying to change.

Specify the add-on name instead of the name of the add-on service.
For example, instead of: ${color.blue('heroku addons:upgrade ' + addon + ' ' + (plan || ''))}
Run this: ${color.blue('heroku addons:upgrade ' + example + ' ' + addon + ':' + plan)}
${app ? '' : 'Alternatively, specify an app to filter by with ' + color.blue('--app')}
${color.cyan('https://devcenter.heroku.com/articles/managing-add-ons')}`
  }

  protected buildNoPlanError(addon: string): string {
    return `Error: No plan specified.
You need to specify a plan to move ${color.addon(addon)} to.
For example: ${color.blue('heroku addons:upgrade heroku-redis:premium-0')}
${color.cyan('https://devcenter.heroku.com/articles/managing-add-ons')}`
  }

  protected getAddonPartsFromArgs(args: { addon: string, plan: string | undefined }): { plan: string, addon: string } {
    let {addon, plan} = args

    if (!plan && addon.includes(':')) {
      ([addon, plan] = addon.split(':'))
    }

    if (!plan) {
      throw new Error(this.buildNoPlanError(addon))
    }

    // ignore the service part of the plan since we can infer the service based on the add-on
    if (plan.includes(':')) {
      plan = plan.split(':')[1]
    }

    return {addon, plan}
  }

  protected async getPlans(addonServiceName: string | undefined): Promise<Plan[]> {
    try {
      const plansResponse: HTTP<Plan[]> = await this.heroku.get(`/addon-services/${addonServiceName}/plans`)
      const {body: plans} = plansResponse
      plans.sort((a, b) => {
        if (a?.price?.cents === b?.price?.cents) {
          return 0
        }

        if (!a?.price?.cents || !b?.price?.cents || a.price.cents > b.price.cents) {
          return 1
        }

        if (a.price.cents < b.price.cents) {
          return -1
        }

        return 0
      })
      return plans
    } catch {
      return []
    }
  }

  public async run(): Promise<void> {
    const ctx = await this.parse(Upgrade)
    const {args, flags: {app}} = ctx
    // called with just one argument in the form of `heroku addons:upgrade heroku-redis:hobby`
    const {addon, plan} = this.getAddonPartsFromArgs(args)

    let resolvedAddon: ExtendedAddon | Required<AddOn>
    try {
      resolvedAddon = await addonResolver(this.heroku, app, addon)
    } catch (error) {
      if (error instanceof HerokuAPIError && error.http.statusCode === 422 && error.body.id === 'multiple_matches') {
        throw new Error(this.buildApiErrorMessage(error.http.body.message, ctx))
      }

      throw error
    }

    const {name: addonServiceName} = resolvedAddon.addon_service
    const {name: appName} = resolvedAddon.app
    const {name: addonName, plan: resolvedAddonPlan} = resolvedAddon ?? {}
    const updatedPlanName = `${addonServiceName}:${plan}`
    ux.action.start(`Changing ${color.addon(addonName ?? '')} on ${color.app(appName ?? '')} from ${color.blue(resolvedAddonPlan?.name ?? '')} to ${color.blue(updatedPlanName)}`)

    try {
      const patchResult: HTTP<Required<AddOn>> = await this.heroku.patch(`/apps/${appName}/addons/${addonName}`,
        {
          body: {plan: {name: updatedPlanName}},
          headers: {
            'Accept-Expansion': 'plan', 'X-Heroku-Legacy-Provider-Messages': 'true',
          },
        })
      resolvedAddon = patchResult.body
    } catch (error) {
      let errorToThrow = error as Error
      if (error instanceof HerokuAPIError) {
        const {http} = error
        if (http.statusCode === 422
          && http.body.message
          && http.body.message.startsWith('Couldn\'t find either the add-on')) {
          const plans = await this.getPlans(addonServiceName)
          errorToThrow = new Error(`${http.body.message}

Here are the available plans for ${color.addon(addonServiceName || '')}:
${plans.map(plan => plan.name).join('\n')}\n\nSee more plan information with ${color.blue('heroku addons:plans ' + addonServiceName)}

${color.cyan('https://devcenter.heroku.com/articles/managing-add-ons')}`)
        }

        ux.action.stop()
        throw errorToThrow
      }
    }

    ux.action.stop(`done${resolvedAddon.plan?.price ? `, ${formatPriceText(resolvedAddon.plan.price)}` : ''}`)
    if (resolvedAddon.provision_message) {
      ux.stdout(resolvedAddon.provision_message)
    }
  }
}
