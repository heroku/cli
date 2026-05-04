import {hux} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'

import {hostStatus} from './format.js'

export type Host = {
  allocated_at: string,
  available_capacity_percentage: number,
  host_id: string,
  released_at: string,
  state: string,
}

export function displayHosts(space: string, hosts: Host[]) {
  hux.styledHeader(`${space} Hosts`)
  /* eslint-disable perfectionist/sort-objects */
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
  /* eslint-enable perfectionist/sort-objects */
}

export function displayHostsAsJSON(hosts: Host[]) {
  ux.stdout(JSON.stringify(hosts, null, 2))
}
