import {expect, test} from '@oclif/test'

import logDisplayer from '../../../src/lib/log-displayer'

describe('helpers.logDisplayer()', () => {
  test
    .it('displays an error when the error code is not "EPIPE"')

  describe('v2 logs', () => {
    test
      .it('displays the log stream error when isTail is true and the error status is 404 or 403')

    test
      .it('displays the eventsource error when isTail is false or the error status is not 404 or 403')

    test
      .it('displays colorized logs')
  })

  describe('v1 logs', () => {
    test
      .it('displays colorized logs')

    test
      .it('resolves the promise on end')

    test
      .it('rejects the promise on error')
  })
})
