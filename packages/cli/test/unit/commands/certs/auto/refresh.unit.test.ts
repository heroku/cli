import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/certs/auto/refresh'
import runCommand from '../../../../helpers/runCommand'
import expectOutput from '../../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'
import * as nock from 'nock'
import {expect} from '@oclif/test'

describe('heroku certs:auto:enable', function () {
  beforeEach(function () {
    nock.cleanAll()
  })

  it('refreshes acm', async function () {
    nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    })
      .patch('/apps/example/acm', {acm_refresh: true})
      .reply(200, {acm: true, acm_refresh: true})
    await runCommand(Cmd, [
      '--app',
      'example',
    ])
    expect(stderr.output).to.contain(heredoc(`
      Refreshing Automatic Certificate Management... done
    `))
    expectOutput((stdout.output), '')
  })
})
