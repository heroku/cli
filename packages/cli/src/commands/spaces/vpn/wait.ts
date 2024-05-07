import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

const cli = require('@heroku/heroku-cli-util')
const wait = (ms: number) => new Promise(resolve => {
  setTimeout(resolve, ms)
})
function check(val: string | undefined, message:string) {
  if (!val)
    throw new Error(`${message}.\nUSAGE: heroku spaces:vpn:wait --space my-space vpn-connection-name`)
}

export default class Wait extends Command {
    static topic = 'spaces';
    static description = 'wait for VPN Connection to be created';
    static flags = {
      space: flags.string({char: 's', description: 'space the vpn connection belongs to'}),
      name: flags.string({char: 'n', description: 'name or id of the vpn connection to wait for'}),
      json: flags.boolean({description: 'output in json format'}),
      interval: flags.string({char: 'i', description: 'seconds to wait between poll intervals'}),
      timeout: flags.string({char: 't', description: 'maximum number of seconds to wait'}),
    };

    static args = {
      name: Args.string({hidden: true}),
    };

    public async run(): Promise<void> {
      const {flags, argv, args} = await this.parse(Wait)
      const space = flags.space
      check(space, 'Space name required')
      const name = flags.name || args.name
      check(name, 'VPN connection name required')
      const interval = (flags.interval ? Number.parseInt(flags.interval, 10) : 10) * 1000
      const timeout = (flags.timeout ? Number.parseInt(flags.timeout, 10) : 20 * 60) * 1000
      const deadline = new Date(Date.now() + timeout)
      let lib = require('../../lib/vpn-connections')(heroku)
      let info = await lib.getVPNConnection(space, name)
      if (info.status === 'active') {
        ux.log('VPN has been allocated.')
        return
      }

      const spinner = new cli.Spinner({text: `Waiting for VPN Connection ${color.green(name)} to allocate...`})
      spinner.start()
      do {
        if (Date.now() >= deadline) {
          throw new Error('Timeout waiting for VPN to become allocated.')
        }

        if (info.status === 'failed') {
          throw new Error(info.status_message)
        }

        await wait(interval)
        info = await lib.getVPNConnection(space, name)
      } while (info.status !== 'active')

      spinner.stop('done\n')
      var config = await lib.getVPNConnection(space, name)
      lib.displayVPNConfigInfo(space, name, config)
    }
}
