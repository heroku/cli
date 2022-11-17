import {expect, test} from '@oclif/test'
import * as sinon from 'sinon'

import Dyno from '../../src/lib/dyno'

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
  .command(['rake', '--size=free', '--app=heroku-cli-ci-smoke-test-app', 'test'])
  .catch(error => {
    expect(error.message).to.include('Free dynos are no longer available.')
  })
  .it('errors if free flag is passed')
})
