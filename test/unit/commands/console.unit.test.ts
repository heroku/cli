/* eslint-disable @typescript-eslint/ban-ts-comment */
import {expect} from 'chai'
import sinon from 'sinon'

import RunConsole from '../../../src/commands/console.js'
import Dyno from '../../../src/lib/run/dyno.js'
import runCommandHelper from '../../helpers/runCommand.js'

describe('console', function () {
  let dynoOpts: {command: string}

  afterEach(function () {
    sinon.restore()
  })

  it('runs console', async function () {
    sinon.stub(Dyno.prototype, 'start').callsFake(function () {
      // @ts-ignore
      dynoOpts = this.opts
      return Promise.resolve()
    })

    await runCommandHelper(RunConsole, ['--app=heroku-cli-ci-smoke-test-app'])

    expect(dynoOpts.command).to.equal('console')
  })
})
