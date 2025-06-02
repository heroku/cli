import {expect, test} from '@oclif/test'

describe('auth:logout', function () {
  test
    .stderr()
    .command(['logout'])
    .it('shows cli logging user out', ({stderr}) => {
      // TODO figure out why this test is not working as expected
      expect(stderr).to.contain('done')
    })
})
