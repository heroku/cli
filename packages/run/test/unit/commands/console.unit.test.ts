import {expect, test} from '@oclif/test'
import * as sinon from 'sinon'

import Dyno from '../../../src/lib/dyno'

describe('console', () => {
  let dynoOpts

  test
    .stub(Dyno.prototype, 'start', sinon.stub().callsFake(function () {
      dynoOpts = this.opts
      return Promise.resolve()
    }))
    .command(['console', '--app=heroku-cli-ci-smoke-test-app'])
    .it('runs console', () => {
      expect(dynoOpts.command).to.equal('console')
    })
})
