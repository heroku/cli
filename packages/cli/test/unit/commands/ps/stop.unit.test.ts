import {stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/ps/stop.js'
import runCommand from '../../../helpers/runCommand.js'
import nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput.js'
import {expect} from 'chai'
import stripAnsi from 'strip-ansi'
import tsheredoc from 'tsheredoc'
const heredoc = tsheredoc.default

describe('ps:stop', function () {
  it('requires a dyno name or type', async function () {
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ]).catch(error => {
      expect(error.message).to.include('Please specify a process type or dyno name to stop.')
    })
  })

  it('restarts web dynos', async function () {
    nock('https://api.heroku.com')
      .post('/apps/myapp/formations/web/actions/stop')
      .reply(202)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--process-type',
      'web',
    ])
    expectOutput(stderr.output, 'Stopping all web dynos on ⬢ myapp... done')
  })

  it('restarts a specific dyno', async function () {
    nock('https://api.heroku.com')
      .post('/apps/myapp/dynos/web.1/actions/stop')
      .reply(202)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--dyno-name',
      'web.1',
    ])
    expectOutput(stderr.output, 'Stopping dyno web.1 on ⬢ myapp... done')
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
    expect(stripAnsi(stderr.output)).to.include('Warning: DYNO is a deprecated argument.')
    expect(stderr.output).to.include('Stopping dyno web.1 on ⬢ myapp... done')
  })
})
