import {stdout} from 'stdout-stderr'
import Cmd from '../../../../src/commands/spaces/hosts'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import expectOutput from '../../../helpers/utils/expectOutput'
import {expect} from 'chai'

describe('spaces:hosts', function () {
  const hosts = [
    {
      host_id: 'h-0f927460a59aac18e',
      state: 'available',
      available_capacity_percentage: 72,
      allocated_at: '2020-05-28T04:15:59Z',
      released_at: null,
    }, {
      host_id: 'h-0e927460a59aac18f',
      state: 'released',
      available_capacity_percentage: 0,
      allocated_at: '2020-03-28T04:15:59Z',
      released_at: '2020-04-28T04:15:59Z',
    },
  ]

  it('lists space hosts', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/hosts')
      .reply(200, hosts)
    await runCommand(Cmd, [
      '--space',
      'my-space',
    ])

    expectOutput(stdout.output, heredoc(`
      === my-space Hosts
       Host ID             State     Available Capacity Allocated At         Released At
       ─────────────────── ───────── ────────────────── ──────────────────── ────────────────────
       h-0f927460a59aac18e available 72%                2020-05-28T04:15:59Z
       h-0e927460a59aac18f released  0%                 2020-03-28T04:15:59Z 2020-04-28T04:15:59Z
    `))
  })

  it('shows hosts:info --json', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/hosts')
      .reply(200, hosts)

    await runCommand(Cmd, [
      '--space',
      'my-space',
      '--json',
    ])
    expect(JSON.parse(stdout.output)).to.eql(hosts)
  })
})
