import {expect, test} from '@oclif/test'

describe('local:start', () => {
  test
    .stdout()
    .command(['local:start', '--restart'])
    .catch( e => {
      expect(e.message).to.equal('--restart is no longer available\nUse forego instead: https://github.com/ddollar/forego')
    })
    .it('errors with proper usage suggestion')

    test
    .stdout()
    .command(['local:start', '--cconcurrency'])
    .catch( e => {
      expect(e.message).to.equal('--restart is no longer available\nUse forego instead: https://github.com/ddollar/forego')
    })
    .it('errors with proper usage suggestion')
})
