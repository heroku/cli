import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import createAddon from '../../lib/addons/create_addon.js'
import * as util from '../../lib/addons/util.js'
import notify from '../../lib/notify.js'

const heredoc = tsheredoc.default

function parseConfig(args: string[]) {
  const config: Record<string, boolean | string> = {}
  while (args.length > 0) {
    let key = args.shift() as string
    if (!key.startsWith('--'))
      throw new Error(`Unexpected argument ${key}`)
    key = key.replace(/^--/, '')
    let val
    if (key.includes('=')) {
      [key, ...val] = key.split('=')
      val = val.join('=')
      if (val === 'true') {
        val = true
      }

      config[key] = val
    } else {
      val = args.shift()
      if (!val) {
        config[key] = true
      } else if (val.startsWith('--')) {
        config[key] = true
        args.unshift(val)
      } else {
        config[key] = val
      }
    }
  }

  return config
}

export default class Create extends Command {
  static args = {
    'service:plan': Args.string({description: 'unique identifier or unique name of the add-on service plan', required: true}),
  }

  static description = heredoc`
    Create a new add-on resource.

    In order to add additional config items, please place them at the end of the command after a double-dash (--).
  `

  static examples = [
    heredoc(`
      # Create an add-on resource:
      ${color.command('heroku addons:create heroku-redis --app my-app')}
    `),
    heredoc(`
      # Create an add-on resource with additional config items:
      ${color.command('heroku addons:create heroku-postgresql:standard-0 --app my-app -- --fork DATABASE')}
    `),
  ]

  static flags = {
    app: flags.app({required: true}),
    as: flags.string({description: 'name for the initial add-on attachment'}),
    confirm: flags.string({description: 'overwrite existing config vars or existing add-on attachments'}),
    name: flags.string({description: 'name for the add-on resource'}),
    remote: flags.remote(),
    wait: flags.boolean({description: 'watch add-on creation status and exit when complete'}),
  }

  static hiddenAliases = ['addons:add']
  public static notifier: (subtitle: string, message: string, success?: boolean) => void = notify

  static strict = false

  public async run(): Promise<void> {
    this.allowArbitraryFlags = true
    const {args, flags, ...restParse} = await this.parse(Create)
    const {app, as, confirm, name, wait} = flags
    const servicePlan = args['service:plan']
    // oclif duplicates specified args in argv
    const argv = (restParse.argv as string[])
      .filter(arg => arg !== servicePlan)

    if (restParse.nonExistentFlags && restParse.nonExistentFlags.length > 0) {
      ux.warn(`For example: ${color.code(`heroku addons:create -a ${app} ${restParse.raw[0].input} -- ${restParse.nonExistentFlags.join(' ')}`)}`)
      ux.warn(`See ${color.info('https://devcenter.heroku.com/changelog-items/2925')} for more info.\n`)
    }

    const config = parseConfig(argv)
    let addon: Heroku.AddOn
    try {
      addon = await createAddon(this.heroku, app, servicePlan, confirm, wait, {as, config, name})
      if (wait) {
        Create.notifier(`heroku addons:create ${addon.name}`, 'Add-on successfully provisioned')
      }
    } catch (error) {
      if (wait) {
        Create.notifier(`heroku addons:create ${servicePlan}`, 'Add-on failed to provision', false)
      }

      throw error
    }

    await this.config.runHook('recache', {addon, app, type: 'addon'})
    // eslint-disable-next-line no-unsafe-optional-chaining
    ux.stdout(`Run ${color.code('heroku addons:docs ' + addon?.addon_service?.name || '')} to view documentation.`)
  }
}
