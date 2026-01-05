'use strict'
import {expect, test} from '@oclif/test'

describe('git:clone', function () {
  test
    .stderr()
    .command(['git:credentials'])
    .catch(error => {
      expect(error.message).to.contain('Missing 1 required arg')
    })
    .it('errors if no app given')
})
