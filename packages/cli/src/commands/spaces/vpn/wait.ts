import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {displayVPNConfigInfo} from '../../../lib/spaces/vpn-connections'
import heredoc from 'tsheredoc'

const wait = (ms: number) => new Promise(resolve => {
  setTimeout(resolve, ms)
})

export default class Wait extends Command {
    static topic = 'spaces';
    static description = 'wait for VPN Connection to be created';
    static examples = [heredoc`
      $ heroku spaces:vpn:wait vpn-connection-name --space my-space
      Waiting for VPN Connection vpn-connection-name to allocate... done
      === my-space VPN Tunnels

     VPN Tunnel Customer Gateway VPN Gateway    Pre-shared Key Routable Subnets IKE Version
     ────────── ──────────────── ────────────── ────────────── ──────────────── ───────────
     Tunnel 1    104.196.121.200   35.171.237.136  abcdef12345     10.0.0.0/16       1
     Tunnel 2    104.196.121.200   52.44.7.216     fedcba54321     10.0.0.0/16       1
    `]

    static flags = {
      space: flags.string({char: 's', description: 'space the vpn connection belongs to', required: true}),
      json: flags.boolean({description: 'output in json format'}),
      interval: flags.string({char: 'i', description: 'seconds to wait between poll intervals'}),
      timeout: flags.string({char: 't', description: 'maximum number of seconds to wait'}),
    }

    static args = {
      name: Args.string({
        description: 'name or id of the VPN connection to get info from',
        required: true,
      }),
    }

    public async run(): Promise<void> {
      const {flags, args} = await this.parse(Wait)
      const {space, json} = flags
      const {name} = args
      const interval = (flags.interval ? Number.parseInt(flags.interval, 10) : 10) * 1000
      const timeout = (flags.timeout ? Number.parseInt(flags.timeout, 10) : 20 * 60) * 1000
      const deadline = new Date(Date.now() + timeout)
      let {body: vpnConnection} = await this.heroku.get<Heroku.PrivateSpacesVpn>(`/spaces/${space}/vpn-connections/${name}`)
      if (vpnConnection.status === 'active') {
        ux.log('VPN has been allocated.')
        return
      }

      ux.action.start(`Waiting for VPN Connection ${color.green(name)} to allocate...`)
      while (vpnConnection.status !== 'active') {
        if (new Date() > deadline) {
          ux.error('Timeout waiting for VPN to become allocated.', {exit: 1})
        }

        if (vpnConnection.status === 'failed') {
          ux.error(vpnConnection.status_message || '', {exit: 1})
        }

        await wait(interval)
        const {body: updatedVpnConnection} = await this.heroku.get<Heroku.PrivateSpacesVpn>(`/spaces/${space}/vpn-connections/${name}`)
        vpnConnection = updatedVpnConnection
      }

      ux.action.stop()
      const {body: newVpnConnection} = await this.heroku.get<Heroku.PrivateSpacesVpn>(`/spaces/${space}/vpn-connections/${name}`)
      if (json) {
        ux.styledJSON(newVpnConnection)
      } else {
        displayVPNConfigInfo(space, name, newVpnConnection)
      }
    }
}
