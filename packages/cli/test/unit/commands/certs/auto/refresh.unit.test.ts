import {stdout, stderr} from 'stdout-stderr'
// import Cmd from '../../../../../src/commands/certs/auto/refresh.js'
import runCommand from '../../../../helpers/runCommand.js'
import expectOutput from '../../../../helpers/utils/expectOutput.js'
import tsheredoc from 'tsheredoc'
import nock from 'nock'

const heredoc = tsheredoc.default

/*
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
      Refreshing Automatic Certificate Management... done
    `))
    expectOutput((stdout.output), '')
  })
})

*/
