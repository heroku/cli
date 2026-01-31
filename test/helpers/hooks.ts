import nock from 'nock'
// ux.action.start and stop are not working as expected in tests
// this stub is a workaround to get the tests to pass by just
// directly writing to stderr what ux.action.start and stop would write
import {stubUxActionStart} from './uxStub.js'

let uxStub: {restore: () => void}

export const mochaHooks = {
  afterEach(done: () => void) {
    nock.cleanAll()
    uxStub.restore()
    done()
  },

  beforeEach(done: () => void) {
    uxStub = stubUxActionStart()
    done()
  },
}
