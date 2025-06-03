import {expect, test} from '@oclif/test'

describe('auth:logout', function () {
  test
    .stderr()
    .command(['logout'])
    .it('shows cli logging user out', ({stderr}) => {
      expect(stderr).to.equal('Logging out... done\n')
    })
})
