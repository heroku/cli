import {expect, test} from '@oclif/test'

describe('auth:logout', async () => {
  test
    .stderr()
    .command(['logout'])
    .it('shows cli logging user out', ({stderr}) => {
      expect(stderr).to.contain('Logging out')
    })
})
