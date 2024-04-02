import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {formatPriceText} from '../../lib/addons/util'
import {addonResolver} from '../../lib/addons/resolve'
import type {AddOn, Plan} from '@heroku-cli/schema'
import {HTTP} from 'http-call'
import {HerokuAPIError} from '@heroku-cli/command/lib/api-client'
import type {AddOnAttachmentWithConfigVarsAndPlan} from '../../lib/pg/types'

export default class Upgrade extends Command {
  static aliases = ['addons:downgrade']
  static topic = 'addons'
  static description = 'change add-on plan'
  static help = 'See available plans with `heroku addons:plans SERVICE`.\n\nNote that `heroku addons:upgrade` and `heroku addons:downgrade` are the same.\nEither one can be used to change an add-on plan up or down.\n\nhttps://devcenter.heroku.com/articles/managing-add-ons'
  static examples = ['Upgrade an add-on by service name:\n$ heroku addons:upgrade heroku-redis:premium-2\n\nUpgrade a specific add-on:\n$ heroku addons:upgrade swimming-briskly-123 heroku-redis:premium-2']
  static flags = {
    app: flags.app(),
    remote: flags.remote(),
  }

  static args = {
    addon: Args.string({required: true}),
    plan: Args.string(),
  }

  private parsed = this.parse(Upgrade)

  public async run(): Promise<void> {
    const ctx = await this.parsed
    const {flags: {app}, args} = ctx
    // called with just one argument in the form of `heroku addons:upgrade heroku-redis:hobby`
    const {addon, plan} = this.getAddonPartsFromArgs(args)

    let resolvedAddon: Required<AddOn> | AddOnAttachmentWithConfigVarsAndPlan
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
    ux.action.start(`Changing ${color.magenta(addonName ?? '')} on ${color.cyan(appName ?? '')} from ${color.blue(resolvedAddonPlan?.name ?? '')} to ${color.blue(updatedPlanName)}`)

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
        if (http.statusCode === 422 &&
          http.body.message &&
          http.body.message.startsWith('Couldn\'t find either the add-on')) {
          const plans = await this.getPlans(addonServiceName)
          errorToThrow = new Error(`${http.body.message}

Here are the available plans for ${color.yellow(addonServiceName || '')}:
${plans.map(plan => plan.name).join('\n')}\n\nSee more plan information with ${color.blue('heroku addons:plans ' + addonServiceName)}

${color.cyan('https://devcenter.heroku.com/articles/managing-add-ons')}`)
        }

        ux.action.stop()
        throw errorToThrow
      }
    }

    ux.action.stop(`done${resolvedAddon.plan?.price ? `, ${formatPriceText(resolvedAddon.plan.price)}` : ''}`)
    if (resolvedAddon.provision_message) {
      ux.log(resolvedAddon.provision_message)
    }
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

    return {plan, addon}
  }

  protected buildNoPlanError(addon: string): string {
    return `Error: No plan specified.
You need to specify a plan to move ${color.yellow(addon)} to.
For example: ${color.blue('heroku addons:upgrade heroku-redis:premium-0')}
${color.cyan('https://devcenter.heroku.com/articles/managing-add-ons')}`
  }

  protected buildApiErrorMessage(errorMessage: string, ctx: Awaited<typeof this.parsed>) {
    const {flags: {app}, args: {addon, plan}} = ctx
    const example = errorMessage.split(', ')[2] || 'redis-triangular-1234'
    return `${errorMessage}

Multiple add-ons match ${color.yellow(addon)}${app ? ' on ' + app : ''}
It is not clear which add-on's plan you are trying to change.

Specify the add-on name instead of the name of the add-on service.
For example, instead of: ${color.blue('heroku addons:upgrade ' + addon + ' ' + (plan || ''))}
Run this: ${color.blue('heroku addons:upgrade ' + example + ' ' + addon + ':' + plan)}
${app ? '' : 'Alternatively, specify an app to filter by with ' + color.blue('--app')}
${color.cyan('https://devcenter.heroku.com/articles/managing-add-ons')}`
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
}
