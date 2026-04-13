import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stderr} from 'stdout-stderr'

import Cmd from '../../../../src/commands/ps/restart.js'
import runCommand from '../../../helpers/legacy-run-command.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'

describe('ps:restart', function () {
  it('restarts all dynos', async function () {
    nock('https://api.heroku.com')
      .delete('/apps/myapp/dynos')
      .reply(202)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expectOutput(stderr.output, 'Restarting all dynos on ⬢ myapp... done')
  })

  it('restarts web dynos', async function () {
    nock('https://api.heroku.com')
      .delete('/apps/myapp/formations/web')
      .reply(202)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--process-type',
      'web',
    ])
    expectOutput(stderr.output, 'Restarting all web dynos on ⬢ myapp... done')
  })

  it('restarts a specific dyno', async function () {
    nock('https://api.heroku.com')
      .delete('/apps/myapp/dynos/web.1')
      .reply(202)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--dyno-name',
      'web.1',
    ])
    expectOutput(stderr.output, 'Restarting dyno web.1 on ⬢ myapp... done')
  })

  it('emits a warning when passing dyno as an arg', async function () {
    nock('https://api.heroku.com')
      .delete('/apps/myapp/dynos/web.1')
      .reply(202)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'web.1',
    ])
    expect(ansis.strip(stderr.output)).to.include('DYNO is a deprecated argument.')
    expect(stderr.output).to.include('Restarting dyno web.1 on ⬢ myapp... done')
  })
})
