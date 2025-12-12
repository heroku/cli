import {stdout} from 'stdout-stderr'
import {expect} from 'chai'
import {Host, displayHosts, displayHostsAsJSON} from '../../../../src/lib/spaces/hosts.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

const hosts: Host[] = [
  {
    host_id: 'h-0f927460a59aac18e',
    state: 'available',
    available_capacity_percentage: 72,
    allocated_at: '2020-05-28T04:15:59Z',
    released_at: '',
  }, {
    host_id: 'h-0e927460a59aac18f',
    state: 'released',
    available_capacity_percentage: 0,
    allocated_at: '2020-03-28T04:15:59Z',
    released_at: '2020-04-28T04:15:59Z',
  },
]

describe('displayHosts', function () {
  it('displays hosts when json flag is false', function () {
    stdout.start()
    displayHosts('my-space', hosts)
    stdout.stop()

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace('=== my-space Hosts'))
    expect(actual).to.include(removeAllWhitespace('Host ID             State     Available Capacity Allocated At         Released At'))
    expect(actual).to.include(removeAllWhitespace('h-0f927460a59aac18e available 72%                2020-05-28T04:15:59Z'))
    expect(actual).to.include(removeAllWhitespace('h-0e927460a59aac18f released  0%                 2020-03-28T04:15:59Z 2020-04-28T04:15:59Z'))
  })
})

describe('displayHostsAsJSON', function () {
  it('displays hosts when json flag is true', function () {
    stdout.start()
    displayHostsAsJSON(hosts)
    stdout.stop()
    expect(JSON.parse(stdout.output)).to.eql(hosts)
  })
})
