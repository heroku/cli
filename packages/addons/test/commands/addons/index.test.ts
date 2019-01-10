import {expect, test} from '@oclif/test'

describe('addons', () => {
  test
    .stdout()
    .command(['addons'])
    .catch(e => {
      expect(e.message).to.contain('You need to specify the scope via --app or --all')
    })
    .it('runs without flags')
})
