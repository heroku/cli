import {expect, test} from '@oclif/test'
import * as sinon from 'sinon'

import Dyno from '../../../src/lib/dyno'

describe('rake', () => {
  let dynoOpts

  test
    .stub(Dyno.prototype, 'start', sinon.stub().callsFake(function () {
      dynoOpts = this.opts
      return Promise.resolve()
    }))
    .command(['rake', '--app=heroku-cli-ci-smoke-test-app', 'test'])
    .it('runs rake', () => {
      expect(dynoOpts.command).to.equal('rake test')
    })

  test
    .stub(Dyno.prototype, 'start', sinon.stub().callsFake(function () {
      const err:any = new Error('rake error')
      err.exitCode = 1
      throw err
    }))
    .command(['rake', '--app=heroku-cli-ci-smoke-test-app', 'test'])
    .catch(error => expect(error.message).to.equal('rake error'))
    .it('catches error with an exit code')

  test
    .stub(Dyno.prototype, 'start', sinon.stub().callsFake(function () {
      const err = new Error('rake error')
      throw err
    }))
    .command(['rake', '--app=heroku-cli-ci-smoke-test-app', 'test'])
    .catch(error => expect(error.message).to.equal('rake error'))
    .it('catches error without an exit code')
})
