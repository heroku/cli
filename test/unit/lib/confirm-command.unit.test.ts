import {captureOutput} from '@heroku-cli/test-utils'
import {hux} from '@heroku/heroku-cli-util'
import ansis from 'ansis'
import {expect} from 'chai'
import sinon from 'sinon'

import ConfirmCommand from '../../../src/lib/confirm-command.js'

describe('confirmApp', function () {
  afterEach(function () {
    sinon.restore()
  })

  it('should not error or prompt with confirm flag match', async function () {
    const {stderr, stdout} = await captureOutput(async () => {
      await new ConfirmCommand().confirm('app', 'app')
    })

    expect(stderr).to.equal('')
    expect(stdout).to.equal('')
  })

  it('should err on confirm flag mismatch', async function () {
    try {
      await captureOutput(async () => {
        await new ConfirmCommand().confirm('app', 'nope')
      })
      expect.fail('Expected confirm to throw error')
    } catch (error: any) {
      expect(ansis.strip(error.message)).to.equal('Confirmation nope did not match app. Aborted.')
    }
  })

  it('should not err on confirm prompt match', async function () {
    sinon.stub(hux, 'prompt').resolves('app')

    const {stderr, stdout} = await captureOutput(async () => {
      await new ConfirmCommand().confirm('app')
    })

    expect(stderr).to.contain('Warning: Destructive Action')
    expect(stdout).to.equal('')
  })

  it('should display custom message', async function () {
    const customMessage = 'custom message'
    sinon.stub(hux, 'prompt').resolves('app')

    const {stderr, stdout} = await captureOutput(async () => {
      await new ConfirmCommand().confirm('app', undefined, customMessage)
    })

    expect(stderr).to.contain(customMessage)
    expect(stdout).to.equal('')
  })

  it('should err on confirm prompt mismatch', async function () {
    sinon.stub(hux, 'prompt').resolves('nope')

    try {
      await captureOutput(async () => {
        await new ConfirmCommand().confirm('app')
      })
      expect.fail('Expected confirm to throw error')
    } catch (error: any) {
      expect(ansis.strip(error.message)).to.equal('Confirmation did not match app. Aborted.')
    }
  })
})
