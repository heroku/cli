import nock from 'nock'

// createSDK/createApiClient register process-wide SIGINT/SIGTERM listeners for the
// cancellation signal. Tear them down (and reset the memoized controller) after each
// test so listeners don't leak across the run or fire during an unrelated test.
import {resetCliAbortSignal} from '../../src/lib/sdk.js'
// @heroku-cli/command reads and writes credentials via the OS (keychain / .netrc)
// Unit tests should not run that code; we swap in a fake provider and restore after.
import {stubCredentialManager} from './credential-manager-stub.js'
// ux.action.start and stop are not working as expected in tests
// this stub is a workaround to get the tests to pass by just
// directly writing to stderr what ux.action.start and stop would write
import {stubUxActionStart} from './ux-stub.js'

let uxStub: {restore: () => void}
let credentialManagerStub: {restore: () => void}

export const mochaHooks = {
  afterEach(done: () => void) {
    nock.cleanAll()
    uxStub.restore()
    credentialManagerStub.restore()
    resetCliAbortSignal()
    done()
  },

  beforeEach(done: () => void) {
    uxStub = stubUxActionStart()
    credentialManagerStub = stubCredentialManager()
    done()
  },
}
