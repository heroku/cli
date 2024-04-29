import {stdout} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/backups/url'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import expectOutput from '../../../../helpers/utils/expectOutput'

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
          {succeeded: true, to_type: 'gof3r', num: 3},
        ])
    })

    it('shows URL', async function () {
      await cmdRun(['--app', 'myapp'])
      expectOutput(stdout.output, 'https://dburl')
    })
  })

  context('with id', function () {
    it('shows URL', async function () {
      await cmdRun(['--app', 'myapp', 'b003'])
      expectOutput(stdout.output, 'https://dburl')
    })
  })
}

describe('pg:backups:url', function () {
  shouldUrl((args: string[]) => runCommand(Cmd, args))
})
