import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/releases/retry'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import expectOutput from '../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'

describe('releases:retry', async function () {
  afterEach(function () {
    return nock.cleanAll()
  })

  it('errors when there are no releases yet', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/releases')
      .reply(200, [])

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ]).catch((error: any) => {
      expect(error.message).to.eq('No release found for this app')
    })
  })
})
