import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import {hostStatus} from './format'

export type Host = {
  host_id: string,
  state: string,
  available_capacity_percentage: number,
  allocated_at: string,
  released_at: string,
}

export function displayHosts(space: string, hosts: Host[]) {
  hux.styledHeader(`${space} Hosts`)
  hux.table(hosts, {
    host_id: {
      header: 'Host ID',
    },
    state: {
      header: 'State',
      get: host => hostStatus(host.state),
    },
    available_capacity_percentage: {
      header: 'Available Capacity',
      get: host => `${host.available_capacity_percentage}%`,
    },
    allocated_at: {
      header: 'Allocated At',
      get: host => host.allocated_at || '',
    },
    released_at: {
      header: 'Released At',
      get: host => host.released_at || '',
    },
  })
}

export function displayHostsAsJSON(hosts: Host[]) {
  ux.log(JSON.stringify(hosts, null, 2))
}
