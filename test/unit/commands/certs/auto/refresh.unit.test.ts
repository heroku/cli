import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/certs/auto/refresh.js'

const heredoc = tsheredoc.default

describe('heroku certs:auto:refresh', function () {
  beforeEach(function () {
    nock.cleanAll()
  })

  it('refreshes acm', async function () {
    nock('https://api.heroku.com')
      .patch('/apps/example/acm', {acm_refresh: true})
      .reply(200, {acm: true, acm_refresh: true})
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
    ])
    expectOutput(stderr, heredoc(`
      Refreshing Automatic Certificate Management... done
    `))
    expectOutput((stdout), '')
  })
})
