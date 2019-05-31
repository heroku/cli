import { expect, test } from '@oclif/test'

describe('local:start', () => {
  test
    .stdout()
    .command(['local:start', '--restart'])
    .catch(e => {
      expect(e.message).to.equal('--restart is no longer available\nUse forego instead: https://github.com/ddollar/forego')
    })
    .it('errors with deprecated restart flag message')

  test
    .stdout()
    .command(['local:start', '--concurrency', 'web=2'])
    .catch(e => {
      expect(e.message).to.equal('--concurrency is no longer available\nUse forego instead: https://github.com/ddollar/forego')
    })
    .it('errors with deprecated concurrency flag')
})
