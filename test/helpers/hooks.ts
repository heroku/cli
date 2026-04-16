import nock from 'nock'
// ux.action.start and stop are not working as expected in tests
// this stub is a workaround to get the tests to pass by just
// directly writing to stderr what ux.action.start and stop would write
import {stubUxActionStart} from './uxStub.js'

// @heroku-cli/command reads and writes credentials via the OS (keychain / .netrc)
// Unit tests should not run that code; we swap in a fake provider and restore after.
import {stubCredentialManager} from './stubs/credential-manager.js'

let uxStub: {restore: () => void}
let credentialManagerStub: {restore: () => void}

export const mochaHooks = {
  afterEach(done: () => void) {
    nock.cleanAll()
    uxStub.restore()
    credentialManagerStub.restore()
    done()
  },

  beforeEach(done: () => void) {
    uxStub = stubUxActionStart()
    credentialManagerStub = stubCredentialManager()
    done()
  },
}
