import {stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/ps/stop'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import expectOutput from '../../../helpers/utils/expectOutput'
import {expect} from 'chai'
import stripAnsi = require('strip-ansi')

describe('ps:stop', function () {
  it('requires a dyno name or type', async function () {
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ]).catch(error => {
      expect(error.message).to.include('Please specify a process type or dyno to stop.')
    })
  })

  it('restarts web dynos', async function () {
    nock('https://api.heroku.com')
      .post('/apps/myapp/formations/web/actions/stop')
      .reply(202)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--type',
      'web',
    ])
    expectOutput(stderr.output, heredoc(`
      Stopping all web dynos on ⬢ myapp...
      Stopping all web dynos on ⬢ myapp... done
    `))
  })

  it('restarts a specific dyno', async function () {
    nock('https://api.heroku.com')
      .post('/apps/myapp/dynos/web.1/actions/stop')
      .reply(202)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--dyno',
      'web.1',
    ])
    expectOutput(stderr.output, heredoc(`
      Stopping dyno web.1 on ⬢ myapp...
      Stopping dyno web.1 on ⬢ myapp... done
    `))
  })

  it('emits a warning when passing dyno as an arg', async function () {
    nock('https://api.heroku.com')
      .post('/apps/myapp/dynos/web.1/actions/stop')
      .reply(202)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'web.1',
    ])
    expect(stripAnsi(stderr.output)).to.include('Warning: Passing DYNO as an arg is deprecated.')
    expect(stderr.output).to.include('Stopping dyno web.1 on ⬢ myapp... done')
  })
})
