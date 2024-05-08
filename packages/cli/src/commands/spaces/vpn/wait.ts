import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import Spinner from '@oclif/core/lib/cli-ux/action/spinner'
import * as Heroku from '@heroku-cli/schema'
import {displayVPNConfigInfo} from '../../../lib/spaces/vpn-connections'

const wait = (ms: number) => new Promise(resolve => {
  setTimeout(resolve, ms)
})

export default class Wait extends Command {
    static topic = 'spaces';
    static description = 'wait for VPN Connection to be created';
    static flags = {
      space: flags.string({char: 's', description: 'space the vpn connection belongs to', required: true}),
      name: flags.string({char: 'n', description: 'name or id of the vpn connection to wait for', required: true}),
      json: flags.boolean({description: 'output in json format'}),
      interval: flags.string({char: 'i', description: 'seconds to wait between poll intervals'}),
      timeout: flags.string({char: 't', description: 'maximum number of seconds to wait'}),
    };

    public async run(): Promise<void> {
      const {flags} = await this.parse(Wait)
      const {name, space} = flags
      const interval = (flags.interval ? Number.parseInt(flags.interval, 10) : 10) * 1000
      const timeout = (flags.timeout ? Number.parseInt(flags.timeout, 10) : 20 * 60) * 1000
      const deadline = new Date(Date.now() + timeout)
      let {body: vpnConnection} = await this.heroku.get<Heroku.PrivateSpacesVpn>(`/spaces/${space}/vpn-connections/${name}`)
      if (vpnConnection.status === 'active') {
        ux.log('VPN has been allocated.')
        return
      }

      const action = new Spinner()
      action.start(`Waiting for VPN Connection ${color.green(name)} to allocate...`)
      while (vpnConnection.status !== 'active') {
        if (new Date() > deadline) {
          throw new Error('Timeout waiting for VPN to become allocated.')
        }

        if (vpnConnection.status === 'failed') {
          throw new Error(vpnConnection.status_message)
        }

        await wait(interval)
        const {body: updatedVpnConnection} = await this.heroku.get<Heroku.PrivateSpacesVpn>(`/spaces/${space}/vpn-connections/${name}`)
        vpnConnection = updatedVpnConnection
      }

      action.stop('done\n')
      const config = await this.heroku.get<Heroku.PrivateSpacesVpn>(`/spaces/${space}/vpn-connections/${name}`)
      displayVPNConfigInfo(space, name, config)
    }
}
