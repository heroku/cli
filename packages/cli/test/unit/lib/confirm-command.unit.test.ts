import {ux} from '@oclif/core'
import {expect, test} from '@oclif/test'
import confirmCommand from '../../../src/lib/confirmCommand'

const stripAnsi = require('strip-ansi')

describe('confirmApp', () => {
  test
    .stdout()
    .stderr()
    .do(() => confirmCommand('app', 'app'))
    .it('should not error or prompt with confirm flag match', ({stderr, stdout}) => {
      expect(stderr).to.equal('')
      expect(stdout).to.equal('')
    })

  test
    .stdout()
    .stderr()
    .do(() => confirmCommand('app', 'nope'))
    .catch((error: Error) => {
      expect(stripAnsi(error.message)).to.equal('Confirmation nope did not match app. Aborted.')
    })
    .it('should err on confirm flag mismatch')

  test
    .stdout()
    .stderr()
    .stub(ux, 'prompt', () => Promise.resolve('app'))
    .do(() => confirmCommand('app'))
    .it('should not err on confirm prompt match', ({stderr, stdout}) => {
      expect(stderr).to.contain('Warning: WARNING: Destructive Action')
      expect(stdout).to.equal('')
    })

  const customMessage = 'custom message'

  test
    .stdout()
    .stderr()
    .stub(ux, 'prompt', () => Promise.resolve('app'))
    .do(() => confirmCommand('app', undefined, customMessage))
    .it('should display custom message', ({stderr, stdout}) => {
      expect(stderr).to.contain(customMessage)
      expect(stdout).to.equal('')
    })

  test
    .stub(ux, 'prompt', () => Promise.resolve('nope'))
    .do(() => confirmCommand('app'))
    .catch((error: Error) => {
      expect(stripAnsi(error.message)).to.equal('Confirmation did not match app. Aborted.')
    })
    .it('should err on confirm prompt mismatch')
})
