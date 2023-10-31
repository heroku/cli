import {ux} from '@oclif/core'
import {expect, test} from '@oclif/test'
import confirmApp from '../../../../src/lib/apps/confirm-app'

const stripAnsi = require('strip-ansi')

describe('confirmApp', () => {
  test
    .stdout()
    .stderr()
    .do(() => confirmApp('app', 'app'))
    .it('should not error or prompt with confirm flag match', ({stderr, stdout}) => {
      expect(stderr).to.equal('')
      expect(stdout).to.equal('')
    })

  test
    .stdout()
    .stderr()
    .do(() => confirmApp('app', 'nope'))
    .catch((error: Error) => {
      expect(stripAnsi(error.message)).to.equal('Confirmation nope did not match app. Aborted.')
    })
    .it('should err on confirm flag mismatch')

  test
    .stdout()
    .stderr()
    .stub(ux, 'prompt', () => Promise.resolve('app'))
    .do(() => confirmApp('app'))
    .it('should not err on confirm prompt match', ({stderr, stdout}) => {
      expect(stderr).to.contain('Warning: WARNING: Destructive Action')
      expect(stdout).to.equal('')
    })

  const customMessage = 'custom message'

  test
    .stdout()
    .stderr()
    .stub(ux, 'prompt', () => Promise.resolve('app'))
    .do(() => confirmApp('app', undefined, customMessage))
    .it('should custom message', ({stderr, stdout}) => {
      expect(stderr).to.contain(customMessage)
      expect(stdout).to.equal('')
    })

  test
    .stub(ux, 'prompt', () => Promise.resolve('nope'))
    .do(() => confirmApp('app'))
    .catch((error: Error) => {
      expect(stripAnsi(error.message)).to.equal('Confirmation did not match app. Aborted.')
    })
    .it('should err on confirm prompt mismatch')
})
