import {stdout} from 'stdout-stderr'
import Cmd from '../../../../src/commands/spaces/topology'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import expectOutput from '../../../helpers/utils/expectOutput'
import * as fixtures from '../../../fixtures/spaces/fixtures'
import {expect} from 'chai'

describe('spaces:topology', function () {
  const topo1 = fixtures.topologies['topology-one']
  const topo2 = fixtures.topologies['topology-two']
  const topo3 = fixtures.topologies['topology-three']
  const app = fixtures.apps.www

  it('shows space topology', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/topology')
      .reply(200, topo1)
      .get(`/apps/${app.id}`)
      .reply(200, app)

    await runCommand(Cmd, [
      '--space',
      'my-space',
    ])
    expectOutput(stdout.output, heredoc(`
      === ${app.name} (web)
      Domains: example.com
               example.net
      Dynos:   web.1 - 10.0.134.42 - 1.example-app-90210.app.localspace
               web.2 - 10.0.134.42 - 1.example-app-90210.app.localspace
    `))
  })

  it('shows space topology with first dyno having higher process number', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/topology')
      .reply(200, topo2)
      .get(`/apps/${app.id}`)
      .reply(200, app)

    await runCommand(Cmd, [
      '--space',
      'my-space',
    ])
    expectOutput(stdout.output, heredoc(`
      === ${app.name} (web)
      Domains: example.com
               example.net
      Dynos:   web.1 - 10.0.134.42 - 1.example-app-90210.app.localspace
               web.2 - 10.0.134.42 - 1.example-app-90210.app.localspace
    `))
  })

  it('shows space topology with dynos having same process number', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/topology')
      .reply(200, topo3)
      .get(`/apps/${app.id}`)
      .reply(200, app)

    await runCommand(Cmd, [
      '--space',
      'my-space',
    ])
    expectOutput(stdout.output, heredoc(`
      === ${app.name} (web)
      Domains: example.com
               example.net
      Dynos:   web.1 - 10.0.134.42 - 1.example-app-90210.app.localspace
               web.1 - 10.0.134.42 - 1.example-app-90210.app.localspace
    `))
  })

  it('shows space topology  --json', async function () {
    nock('https://api.heroku.com')
      .get('/spaces/my-space/topology')
      .reply(200, topo1)
      .get(`/apps/${app.id}`)
      .reply(200, app)

    await runCommand(Cmd, [
      '--space',
      'my-space',
      '--json',
    ])
    expect(JSON.parse(stdout.output)).to.eql(topo1)
  })
})
