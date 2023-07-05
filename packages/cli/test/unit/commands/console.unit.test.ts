/* eslint-disable @typescript-eslint/ban-ts-comment */
import {expect, test} from '@oclif/test'
import * as sinon from 'sinon'

import Dyno from '../../../src/lib/run/dyno'

describe('console', () => {
  let dynoOpts: { command: any }

  test
    .stub(Dyno.prototype, 'start', sinon.stub().callsFake(function () {
      // @ts-ignore
      dynoOpts = this.opts
      return Promise.resolve()
    }))
    .command(['console', '--app=heroku-cli-ci-smoke-test-app'])
    .it('runs console', () => {
      expect(dynoOpts.command).to.equal('console')
    })
})
