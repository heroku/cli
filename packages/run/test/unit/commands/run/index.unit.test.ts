import {expect, test} from '@oclif/test'
import * as sinon from 'sinon'

import Dyno from '../../../../src/lib/dyno'

describe('run/index', () => {
  describe('runs correct command', () => {
    let dynoOpts
    test
      .nock('https://api.heroku.com', api => {
        api.get('/account')
          .reply(200, {})
      })
      .stub(Dyno.prototype, 'start', sinon.stub().callsFake(function () {
        dynoOpts = this.opts
        return Promise.resolve()
      }))
      .command(['run', 'bash', '--app=heroku-cli-ci-smoke-test-app'])
      .it('runs bash', () => {
        expect(dynoOpts.command).to.equal('bash')
      })
  })

  describe('errors without command', async () => {
    test
      .nock('https://api.heroku.com', api => {
        api.get('/account')
          .reply(200, {})
      })
      .stub(Dyno.prototype, 'start', sinon.stub().callsFake(function () {
        return Promise.resolve()
      }))
      .command(['run', '--app=heroku-cli-ci-smoke-test-app'])
      .catch(error => {
        expect(error.message).to.contain('Usage: heroku run COMMAND')
      })
      .it('throws an error')
  })
})
