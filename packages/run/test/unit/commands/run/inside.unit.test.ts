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

  describe('run:inside errors', () => {
    test
      .stub(Dyno.prototype, 'start', sinon.stub().callsFake(function () {
        return Promise.resolve()
      }))
      .command(['run:inside', '--app=heroku-cli-ci-smoke-test-app'])
      .catch(error => {
        expect(error.message).to.contain('Usage: heroku run:inside DYNO COMMAND')
      })
      .it('errors when fewer than two args are passed')

    test
      .stub(Dyno.prototype, 'start', sinon.stub().callsFake(function () {
        return Promise.reject(new Error('failed'))
      }))
      .command(['run:inside', '--app=heroku-cli-ci-smoke-test-app', 'web.1', 'bash'])
      .catch(error => expect(error.message).to.equal('failed'))
      .it('throws a generic error when the request fails and there is no exit code')

    const errorWithCode: any = new Error('failed')
    errorWithCode.exitCode = '403'

    test
      .stub(Dyno.prototype, 'start', sinon.stub().callsFake(function () {
        return Promise.reject(errorWithCode)
      }))
      .command(['run:inside', '--app=heroku-cli-ci-smoke-test-app', 'web.1', 'bash'])
      .catch(error => expect(error.message).to.equal('EEXIT: 403'))
      .it('throws a stylized error when the request fails and there is an exit code')
  })
})
