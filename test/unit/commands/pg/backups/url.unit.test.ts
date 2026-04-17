import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import nock from 'nock'

import Cmd from '../../../../../src/commands/pg/backups/url.js'

const shouldUrl = function (cmdRun: (args: string[]) => Promise<any>) {
  beforeEach(function () {
    nock('https://api.data.heroku.com')
      .post('/client/v11/apps/myapp/transfers/3/actions/public-url')
      .reply(200, {
        url: 'https://dburl',
      })
  })

  afterEach(function () {
    nock.cleanAll()
  })

  context('with no id', function () {
    beforeEach(function () {
      nock('https://api.data.heroku.com')
        .get('/client/v11/apps/myapp/transfers')
        .reply(200, [
          {num: 3, succeeded: true, to_type: 'gof3r'},
        ])
    })

    it('shows URL', async function () {
      const {stdout} = await cmdRun(['--app', 'myapp'])
      expectOutput(stdout, 'https://dburl')
    })
  })

  context('with id', function () {
    it('shows URL', async function () {
      const {stdout} = await cmdRun(['--app', 'myapp', 'b003'])
      expectOutput(stdout, 'https://dburl')
    })
  })
}

describe('pg:backups:url', function () {
  shouldUrl((args: string[]) => runCommand(Cmd, args))
})
