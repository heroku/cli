import {ux} from '@oclif/core/ux'

import {HuxHelpers} from '../hux-helpers.js'
import {hostStatus} from './format.js'

export type Host = {
  allocated_at: string,
  available_capacity_percentage: number,
  host_id: string,
  released_at: string,
  state: string,
}

export function displayHosts(space: string, hosts: Host[]) {
  HuxHelpers.styledHeader(`${space} Hosts`)
  /* eslint-disable perfectionist/sort-objects */
  HuxHelpers.table(hosts, {
    host_id: {
      header: 'Host ID',
    },
    state: {
      header: 'State',
      get: (host: any) => hostStatus(host.state),
    },
    available_capacity_percentage: {
      header: 'Available Capacity',
      get: (host: any) => `${host.available_capacity_percentage}%`,
    },
    allocated_at: {
      header: 'Allocated At',
      get: (host: any) => host.allocated_at || '',
    },
    released_at: {
      header: 'Released At',
      get: (host: any) => host.released_at || '',
    },
  })
  /* eslint-enable perfectionist/sort-objects */
}

export function displayHostsAsJSON(hosts: Host[]) {
  ux.stdout(JSON.stringify(hosts, null, 2))
}
