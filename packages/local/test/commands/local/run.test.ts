import {expect, test} from '@oclif/test'

describe('local:run', () => {
  describe('when no arguments are given', function() {
    test
      .stdout()
      .command(['local:run'])
      .catch(/Usage: heroku local:run \[COMMAND\]/)
      .it('errors with proper usage suggestion')
  })
})
