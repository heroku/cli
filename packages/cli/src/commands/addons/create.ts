import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import notify from '../../lib/notify'
const createAddon = require('../../lib/create_addon')

function parseConfig(args) {
  const config = {}
  while (args.length > 0) {
    let key = args.shift()
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

    static args = {
      'service:plan': Args.string({required: true}),
    };

    public async run(): Promise<void> {
      const {flags, argv, args} = await this.parse(Create)
      let {app, flags, args} = context
      if (args.length === 0) {
        throw new Error('Usage: heroku addons:create SERVICE:PLAN')
      }

      const {name, as, wait, confirm} = flags
      const config = parseConfig(args.slice(1))
      let addon
      try {
        addon = await createAddon(heroku, app, args[0], confirm, wait, {config, name, as})
        if (wait) {
          notify(`heroku addons:create ${addon.name}`, 'Add-on successfully provisioned')
        }
      } catch (error) {
        if (wait) {
          notify(`heroku addons:create ${args[0]}`, 'Add-on failed to provision', false)
        }

        throw error
      }

      await config.runHook('recache', {type: 'addon', app, addon})
      ux.log(`Use ${color.cyan.bold('heroku addons:docs ' + addon.addon_service.name)} to view documentation`)
    }
}
