import {hux} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import sinon from 'sinon'
import {stderr, stdout} from 'stdout-stderr'
import ansis from 'ansis'

import ConfirmCommand from '../../../src/lib/confirmCommand.js'

describe('confirmApp', function () {
  afterEach(function () {
    sinon.restore()
  })

  it('should not error or prompt with confirm flag match', async function () {
    stdout.start()
    stderr.start()

    await new ConfirmCommand().confirm('app', 'app')

    stdout.stop()
    stderr.stop()

    expect(stderr.output).to.equal('')
    expect(stdout.output).to.equal('')
  })

  it('should err on confirm flag mismatch', async function () {
    stdout.start()
    stderr.start()

    try {
      await new ConfirmCommand().confirm('app', 'nope')
      expect.fail('Expected confirm to throw error')
    } catch (error: any) {
      expect(ansis.strip(error.message)).to.equal('Confirmation nope did not match app. Aborted.')
    } finally {
      stdout.stop()
      stderr.stop()
    }
  })

  it('should not err on confirm prompt match', async function () {
    sinon.stub(hux, 'prompt').resolves('app')
    stdout.start()
    stderr.start()

    await new ConfirmCommand().confirm('app')

    stdout.stop()
    stderr.stop()

    expect(stderr.output).to.contain('Warning: Destructive Action')
    expect(stdout.output).to.equal('')
  })

  it('should display custom message', async function () {
    const customMessage = 'custom message'
    sinon.stub(hux, 'prompt').resolves('app')
    stdout.start()
    stderr.start()

    await new ConfirmCommand().confirm('app', undefined, customMessage)

    stdout.stop()
    stderr.stop()

    expect(stderr.output).to.contain(customMessage)
    expect(stdout.output).to.equal('')
  })

  it('should err on confirm prompt mismatch', async function () {
    sinon.stub(hux, 'prompt').resolves('nope')

    try {
      await new ConfirmCommand().confirm('app')
      expect.fail('Expected confirm to throw error')
    } catch (error: any) {
      expect(ansis.strip(error.message)).to.equal('Confirmation did not match app. Aborted.')
    }
  })
})
