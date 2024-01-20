import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import notify from '../../lib/notify'
import createAddon from '../../lib/addons/create_addon'

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
    static topic = 'addons';
    static description = 'create a new add-on resource';
    static strict = false;
    static flags = {
      name: flags.string({description: 'name for the add-on resource'}),
      as: flags.string({description: 'name for the initial add-on attachment'}),
      confirm: flags.string({description: 'overwrite existing config vars or existing add-on attachments'}),
      wait: flags.boolean({description: 'watch add-on creation status and exit when complete'}),
      app: flags.app({required: true}),
    };

    public async run(): Promise<void> {
      const {flags, ...restParse} = await this.parse(Create)
      const {app, name, as, wait, confirm} = flags
      const argv = restParse.argv as string[]
      const [servicePlan, ...restArgs] = argv

      if (!servicePlan) {
        throw new Error('Usage: heroku addons:create SERVICE:PLAN')
      }

      const config = parseConfig(restArgs)
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
