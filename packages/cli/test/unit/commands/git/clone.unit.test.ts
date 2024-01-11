'use strict'
import {expect, test} from '@oclif/test'

describe('git:clone', function () {
  test
    .stderr()
    .command(['git:clone'])
    .catch(error => {
      expect(error.message).to.contain('Missing required flag app')
    })
    .it('errors if no app given')
})
