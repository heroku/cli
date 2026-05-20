import type {AddOn, Plan} from '@heroku-cli/schema'

import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {AddonAmbiguousError, upgrade as upgradeAddon} from '@heroku/sdk/compositions/add-on'
import {createPlatformClient} from '@heroku/sdk/platform'
import {Args, ux} from '@oclif/core'

import {formatPriceText} from '../../lib/addons/util.js'

function isApiError(error: unknown): error is Error & {statusCode: number} {
  return error instanceof Error && 'statusCode' in error && typeof (error as {statusCode?: unknown}).statusCode === 'number'
}

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
  static examples = [
    `# Upgrade an add-on by service name:
    ${color.command('heroku addons:upgrade heroku-redis:premium-2')}`,
    `# Upgrade a specific add-on:
    ${color.command('heroku addons:upgrade swimming-briskly-123 heroku-redis:premium-2')}`,
  ]
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

  protected getAddonPartsFromArgs(args: {addon: string, plan: string | undefined}): {addon: string, plan: string} {
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
    if (!addonServiceName) {
      return []
    }

    try {
      const heroku = createPlatformClient()
      const plans = (await heroku.plan.listByAddOn(addonServiceName)) as unknown as Plan[]
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

    let addonServiceName: string | undefined

    let updatedAddon: Required<AddOn>
    try {
      updatedAddon = await upgradeAddon(addon, plan, {
        appIdentity: app,
        onResolved(resolved) {
          addonServiceName = (resolved.addon_service as undefined | {name?: string})?.name
          const resolvedPlan = resolved.plan as undefined | {name?: string}
          const updatedPlanName = plan.includes(':') ? plan : `${addonServiceName}:${plan}`
          ux.action.start(`Changing ${color.addon(resolved.name ?? '')} on ${color.app(resolved.app.name ?? '')} from ${color.blue(resolvedPlan?.name ?? '')} to ${color.blue(updatedPlanName)}`)
        },
      }) as Required<AddOn>
    } catch (error) {
      if (error instanceof AddonAmbiguousError) {
        // eslint-disable-next-line unicorn/prefer-type-error
        throw new Error(this.buildApiErrorMessage(error.message, ctx))
      }

      let errorToThrow = error as Error
      if (isApiError(error)) {
        const message = error.message || ''
        if (error.statusCode === 422 && message.startsWith('Couldn\'t find either the add-on')) {
          const plans = await this.getPlans(addonServiceName)
          errorToThrow = new Error(`${message}

Here are the available plans for ${color.addon(addonServiceName || '')}:
${plans.map(plan => plan.name).join('\n')}\n\nSee more plan information with ${color.blue('heroku addons:plans ' + addonServiceName)}

${color.cyan('https://devcenter.heroku.com/articles/managing-add-ons')}`)
        }

        ux.action.stop()
        throw errorToThrow
      }

      throw errorToThrow
    }

    ux.action.stop(`done${updatedAddon.plan?.price ? `, ${formatPriceText(updatedAddon.plan.price)}` : ''}`)
    if (updatedAddon.provision_message) {
      ux.stdout(updatedAddon.provision_message)
    }
  }
}
