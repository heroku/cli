import {stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/ps/restart'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import expectOutput from '../../../helpers/utils/expectOutput'
import {expect} from 'chai'
import stripAnsi = require('strip-ansi')

describe('ps:restart', function () {
  it('restarts all dynos', async function () {
    nock('https://api.heroku.com')
      .delete('/apps/myapp/dynos')
      .reply(202)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expectOutput(stderr.output, heredoc(`
      Restarting all dynos on ⬢ myapp...
      Restarting all dynos on ⬢ myapp... done
    `))
  })

  it('restarts web dynos', async function () {
    nock('https://api.heroku.com')
      .delete('/apps/myapp/formations/web')
      .reply(202)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--type',
      'web',
    ])
    expectOutput(stderr.output, heredoc(`
      Restarting all web dynos on ⬢ myapp...
      Restarting all web dynos on ⬢ myapp... done
    `))
  })

  it('restarts a specific dyno', async function () {
    nock('https://api.heroku.com')
      .delete('/apps/myapp/dynos/web.1')
      .reply(202)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--dyno',
      'web.1',
    ])
    expectOutput(stderr.output, heredoc(`
      Restarting dyno web.1 on ⬢ myapp...
      Restarting dyno web.1 on ⬢ myapp... done
    `))
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
    expect(stripAnsi(stderr.output)).to.include('Warning: Passing DYNO as an arg is deprecated. Please use heroku ps:restart --dyno or heroku ps:restart --type instead.')
    expect(stderr.output).to.include('Restarting dyno web.1 on ⬢ myapp... done')
  })
})
