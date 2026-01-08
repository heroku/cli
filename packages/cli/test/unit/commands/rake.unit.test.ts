/* eslint-disable @typescript-eslint/ban-ts-comment */
import {expect} from 'chai'
import * as sinon from 'sinon'

import RakeCommand from '../../../src/commands/rake.js'
import Dyno from '../../../src/lib/run/dyno.js'
import runCommandHelper from '../../helpers/runCommand.js'

describe('rake', function () {
  let dynoOpts: { command: any }

  afterEach(function () {
    sinon.restore()
  })

  it('runs rake', async function () {
    sinon.stub(Dyno.prototype, 'start').callsFake(function () {
      // @ts-ignore
      dynoOpts = this.opts
      return Promise.resolve()
    })

    await runCommandHelper(RakeCommand, ['--app=heroku-cli-ci-smoke-test-app', 'test'])

    expect(dynoOpts.command).to.equal('rake test')
  })

  it('catches error with an exit code', async function () {
    sinon.stub(Dyno.prototype, 'start').callsFake(function () {
      const err:any = new Error('rake error')
      err.exitCode = 1
      throw err
    })

    try {
      await runCommandHelper(RakeCommand, ['--app=heroku-cli-ci-smoke-test-app', 'test'])
      expect.fail('Expected command to throw error')
    } catch (error: any) {
      expect(error.message).to.equal('rake error')
    }
  })

  it('catches error without an exit code', async function () {
    sinon.stub(Dyno.prototype, 'start').callsFake(function () {
      const err = new Error('rake error')
      throw err
    })

    try {
      await runCommandHelper(RakeCommand, ['--app=heroku-cli-ci-smoke-test-app', 'test'])
      expect.fail('Expected command to throw error')
    } catch (error: any) {
      expect(error.message).to.equal('rake error')
    }
  })
})
