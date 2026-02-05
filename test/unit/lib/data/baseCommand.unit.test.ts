import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import BaseCommand from '../../../../src/lib/data/baseCommand.js'
import runCommand from '../../../helpers/runCommand.js'

class BaseCommandTest extends BaseCommand {
  async run() {
    return this.dataApi.get<unknown>('/data/postgres/v1/levels/advanced')
  }
}

describe('BaseCommand', function () {
  let originalEnv: typeof process.env

  beforeEach(function () {
    originalEnv = {...process.env}
    process.env.HEROKU_DATA_HOST = 'api.data.heroku.com'
    process.env.HEROKU_DATA_CONTROL_PLANE = 'test-control-plane'
  })

  afterEach(function () {
    process.env = originalEnv
  })

  context('get dataApi', function () {
    it('respects the value of HEROKU_DATA_HOST', async function () {
      const dataApi = nock('https://api.data.heroku.com')
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, [])

      await runCommand(BaseCommandTest, [], false)

      dataApi.done()
      expect(stderr.output).to.equal('')
      expect(stdout.output).to.equal('')
    })

    it('respects the value of HEROKU_DATA_CONTROL_PLANE', async function () {
      const dataApi = nock('https://api.data.heroku.com')
        .get('/data/postgres/v1/levels/advanced')
        .matchHeader('X-Data-Control-Plane', 'test-control-plane')
        .reply(200, [])

      await runCommand(BaseCommandTest)

      dataApi.done()
      expect(stderr.output).to.equal('')
      expect(stdout.output).to.equal('')
    })
  })
})
