import {hux} from '@heroku/heroku-cli-util'
import {expect, test} from '@oclif/test'
import stripAnsi from 'strip-ansi'

import ConfirmCommand from '../../../src/lib/confirmCommand.js'

describe('confirmApp', function () {
  test
    .stdout()
    .stderr()
    .do(() => new ConfirmCommand().confirm('app', 'app'))
    .it('should not error or prompt with confirm flag match', ({stderr, stdout}) => {
      expect(stderr).to.equal('')
      expect(stdout).to.equal('')
    })

  test
    .stdout()
    .stderr()
    .do(() => new ConfirmCommand().confirm('app', 'nope'))
    .catch((error: Error) => {
      expect(stripAnsi(error.message)).to.equal('Confirmation nope did not match app. Aborted.')
    })
    .it('should err on confirm flag mismatch')

  test
    .stdout()
    .stderr()
    .stub(hux, 'prompt', () => Promise.resolve('app'))
    .do(() => new ConfirmCommand().confirm('app'))
    .it('should not err on confirm prompt match', ({stderr, stdout}) => {
      expect(stderr).to.contain('Warning: WARNING: Destructive Action')
      expect(stdout).to.equal('')
    })

  const customMessage = 'custom message'

  test
    .stdout()
    .stderr()
    .stub(hux, 'prompt', () => Promise.resolve('app'))
    .do(() => new ConfirmCommand().confirm('app', undefined, customMessage))
    .it('should display custom message', ({stderr, stdout}) => {
      expect(stderr).to.contain(customMessage)
      expect(stdout).to.equal('')
    })

  test
    .stub(hux, 'prompt', () => Promise.resolve('nope'))
    .do(() => new ConfirmCommand().confirm('app'))
    .catch((error: Error) => {
      expect(stripAnsi(error.message)).to.equal('Confirmation did not match app. Aborted.')
    })
    .it('should err on confirm prompt mismatch')
})
