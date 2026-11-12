import {captureOutput} from '@heroku-cli/test-utils'
import {hux} from '@heroku/heroku-cli-util'
import ansis from 'ansis'
import {expect} from 'chai'
import {restore, stub} from 'sinon'

import ConfirmCommand from '../../../src/lib/confirm-command.js'

describe('confirmApp', function () {
  afterEach(function () {
    restore()
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
      await new ConfirmCommand().confirm('app', 'nope')
      expect.fail('Expected confirm to throw error')
    } catch (error: any) {
      expect(ansis.strip(error.message)).to.equal('Confirmation nope did not match app. Aborted.')
    }
  })

  it('errors instead of prompting under --json without a confirm value', async function () {
    const prompt = stub(hux, 'prompt')

    const {stderr} = await captureOutput(async () => {
      try {
        await new ConfirmCommand().confirm('app', undefined, 'custom message', {json: true})
        expect.fail('Expected confirm to throw error')
      } catch (error: any) {
        expect(error.message).to.equal('To proceed, re-run this command with --confirm app. Commands don\'t prompt for confirmation with --json.')
      }
    })

    expect(prompt.called).to.equal(false)
    expect(stderr).to.equal('')
  })

  it('accepts a matching confirm value under --json', async function () {
    await new ConfirmCommand().confirm('app', 'app', undefined, {json: true})
  })

  it('should not err on confirm prompt match', async function () {
    stub(hux, 'prompt').resolves('app')

    const {stderr, stdout} = await captureOutput(async () => {
      await new ConfirmCommand().confirm('app')
    })

    expect(stderr).to.contain('Warning: Destructive Action')
    expect(stdout).to.equal('')
  })

  it('should display custom message', async function () {
    const customMessage = 'custom message'
    stub(hux, 'prompt').resolves('app')

    const {stderr, stdout} = await captureOutput(async () => {
      await new ConfirmCommand().confirm('app', undefined, customMessage)
    })

    expect(stderr).to.contain(customMessage)
    expect(stdout).to.equal('')
  })

  it('should err on confirm prompt mismatch', async function () {
    stub(hux, 'prompt').resolves('nope')

    try {
      await new ConfirmCommand().confirm('app')
      expect.fail('Expected confirm to throw error')
    } catch (error: any) {
      expect(ansis.strip(error.message)).to.equal('Confirmation did not match app. Aborted.')
    }
  })
})
