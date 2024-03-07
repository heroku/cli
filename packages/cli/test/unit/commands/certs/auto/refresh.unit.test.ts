import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/certs/auto/refresh'
import runCommand from '../../../../helpers/runCommand'
import expectOutput from '../../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'
import * as nock from 'nock'

describe('heroku certs:auto:refresh', function () {
  beforeEach(function () {
    nock.cleanAll()
  })

  it('refreshes acm', async function () {
    nock('https://api.heroku.com')
      .patch('/apps/example/acm', {acm_refresh: true})
      .reply(200, {acm: true, acm_refresh: true})
    await runCommand(Cmd, [
      '--app',
      'example',
    ])
    expectOutput(stderr.output, heredoc(`
      Refreshing Automatic Certificate Management...
      Refreshing Automatic Certificate Management... done
    `))
    expectOutput((stdout.output), '')
  })
})
