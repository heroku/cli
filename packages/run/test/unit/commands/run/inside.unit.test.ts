import {expect, test} from '@oclif/test'
import * as sinon from 'sinon'

import Dyno from '../../../../src/lib/dyno'

describe('run:inside', () => {
  describe('runs correct command', () => {
    let dynoOpts
    test
      .stub(Dyno.prototype, 'start', sinon.stub().callsFake(function () {
        dynoOpts = this.opts
        return Promise.resolve()
      }))
      .command(['run:inside', 'DYNO_NAME', 'bash', '--app=heroku-cli-ci-smoke-test-app'])
      .it('runs bash', () => {
        expect(dynoOpts.command).to.equal('bash')
      })
  })

  describe('errors without command', () => {
    test
      .stub(Dyno.prototype, 'start', sinon.stub().callsFake(function () {
        return Promise.resolve()
      }))
      .command(['run:inside', '--app=heroku-cli-ci-smoke-test-app'])
      .catch(error => {
        expect(error.message).to.contain('Usage: heroku run:inside DYNO COMMAND')
      })
      .it('throws an error')
  })
})
