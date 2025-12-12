import {expect, test} from '@oclif/test'

describe('local:version', function () {
  test
    .command(['local:version', 'extra'])
    .catch(error => {
      expect(error.message).to.equal('Unexpected argument: extra\nSee more help with --help')
    })
    .it('rejects extra arguments with helpful error', () => {
      // Assertion is in the catch block
    })
})
