'use strict'
import {expect, test} from '@oclif/test'

describe('git:remote', function () {
  test
    .stderr()
    .command(['git:remote'])
    .catch(error => {
      expect(error.message).to.contain('Specify an app with --app')
    })
    .it('errors if no app given')
})
