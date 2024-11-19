import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import notify from '../../lib/notify'
import createAddon from '../../lib/addons/create_addon'
import heredoc from 'tsheredoc'

function parseConfig(args: string[]) {
  const config: Record<string, string | boolean> = {}
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
  static topic = 'addons'
  static description = heredoc`
  Create a new add-on resource.

  In order to add additional config items, please place them at the end of the command after a double-dash (--).
  `

  static example = heredoc`
  Create an add-on resource:
  $heroku addons:create heroku-redis --app my-app

  Create an add-on resource with additional config items:
  $heroku addons:create heroku-postgresql:standard-0 --app my-app -- --fork DATABASE
  `
  static strict = false
  static hiddenAliases = ['addons:add']
  static flags = {
    name: flags.string({description: 'name for the add-on resource'}),
    as: flags.string({description: 'name for the initial add-on attachment'}),
    confirm: flags.string({description: 'overwrite existing config vars or existing add-on attachments'}),
    wait: flags.boolean({description: 'watch add-on creation status and exit when complete'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    'service:plan': Args.string({required: true, description: 'unique identifier or unique name of the add-on service plan'}),
  }

  public async run(): Promise<void> {
    this.allowArbitraryFlags = true
    const {flags, args, ...restParse} = await this.parse(Create)
    const {app, name, as, wait, confirm} = flags
    const servicePlan = args['service:plan']
    const argv = (restParse.argv as string[])
    // oclif duplicates specified args in argv
      .filter(arg => arg !== servicePlan)
    const inferenceRegex = /^heroku-inference/
    const isInferenceAddon = inferenceRegex.test(servicePlan)

    if (restParse.nonExistentFlags && restParse.nonExistentFlags.length > 0) {
      process.stderr.write(` ${color.yellow('›')}   For example: ${color.cyan(`heroku addons:create -a ${app} ${restParse.raw[0].input} -- ${restParse.nonExistentFlags.join(' ')}`)}`)
      process.stderr.write(` ${color.yellow('›')}   See https://devcenter.heroku.com/changelog-items/2925 for more info.\n`)
    }

    if (isInferenceAddon) {
      ux.warn(
        '\n\nThis pilot feature is a Beta Service. You may opt to try such Beta Service in your sole discretion. ' +
    'Any use of the Beta Service is subject to the applicable Beta Services Terms provided at ' +
    'https://www.salesforce.com/company/legal/customer-agreements/. While use of the pilot feature itself is free, ' +
    'to the extent such use consumes a generally available Service, you may be charged for that consumption as set ' +
    'forth in the Documentation. Your continued use of this pilot feature constitutes your acceptance of the foregoing.\n\n' +
    'For clarity and without limitation, the various third-party machine learning and generative artificial intelligence ' +
    '(AI) models and applications (each a “Platform”) integrated with the Beta Service are Non-SFDC Applications, ' +
    'as that term is defined in the Beta Services Terms. Note that these third-party Platforms include features that use ' +
    'generative AI technology. Due to the nature of generative AI, the output that a Platform generates may be ' +
    'unpredictable, and may include inaccurate or harmful responses. Before using any generative AI output, Customer is ' +
    'solely responsible for reviewing the output for accuracy, safety, and compliance with applicable laws and third-party ' +
    'acceptable use policies. In addition, Customer’s use of each Platform may be subject to the Platform’s own terms and ' +
    'conditions, compliance with which Customer is solely responsible.\n',
      )
    }

    const config = parseConfig(argv)
    let addon
    try {
      addon = await createAddon(this.heroku, app, servicePlan, confirm, wait, {config, name, as})
      if (wait) {
        notify(`heroku addons:create ${addon.name}`, 'Add-on successfully provisioned')
      }
    } catch (error) {
      if (wait) {
        notify(`heroku addons:create ${servicePlan}`, 'Add-on failed to provision', false)
      }

      throw error
    }

    await this.config.runHook('recache', {type: 'addon', app, addon})
    // eslint-disable-next-line no-unsafe-optional-chaining
    ux.log(`Use ${color.cyan.bold('heroku addons:docs ' + addon?.addon_service?.name || '')} to view documentation`)
  }
}
