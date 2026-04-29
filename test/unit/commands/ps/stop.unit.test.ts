import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../src/commands/ps/stop.js'

describe('ps:stop', function () {
  it('requires a dyno name or type', async function () {
    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expect(error!.message).to.include('Please specify a process type or dyno name to stop.')
  })

  it('restarts web dynos', async function () {
    nock('https://api.heroku.com')
      .post('/apps/myapp/formations/web/actions/stop')
      .reply(202)

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--process-type',
      'web',
    ])
    expectOutput(stderr, 'Stopping all web dynos on ⬢ myapp... done')
  })

  it('restarts a specific dyno', async function () {
    nock('https://api.heroku.com')
      .post('/apps/myapp/dynos/web.1/actions/stop')
      .reply(202)

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--dyno-name',
      'web.1',
    ])
    expectOutput(stderr, 'Stopping dyno web.1 on ⬢ myapp... done')
  })

  it('emits a warning when passing dyno as an arg', async function () {
    nock('https://api.heroku.com')
      .post('/apps/myapp/dynos/web.1/actions/stop')
      .reply(202)

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'web.1',
    ])
    expect(ansis.strip(stderr)).to.include('Warning: DYNO is a deprecated argument.')
    expect(stderr).to.include('Stopping dyno web.1 on ⬢ myapp... done')
  })
})
