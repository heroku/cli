/* eslint-disable @typescript-eslint/ban-ts-comment */
import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {restore, stub} from 'sinon'

import RunConsole from '../../../src/commands/console.js'
import Dyno from '../../../src/lib/run/dyno.js'

describe('console', function () {
  let dynoOpts: {command: string}

  afterEach(function () {
    restore()
  })

  it('runs console', async function () {
    stub(Dyno.prototype, 'start').callsFake(function () {
      // @ts-ignore
      dynoOpts = this.opts
      return Promise.resolve()
    })

    await runCommand(RunConsole, ['--app=heroku-cli-ci-smoke-test-app'])

    expect(dynoOpts.command).to.equal('console')
  })
})
