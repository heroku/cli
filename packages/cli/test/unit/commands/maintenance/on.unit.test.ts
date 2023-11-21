import {expect, test} from '@oclif/test'

describe('maintenance:on', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => api
      .patch('/apps/myapp', {maintenance: true})
      .reply(200),
    )
    .command(['maintenance:on', '-a', 'myapp'])
    .it('turns maintenance mode on', ({stdout, stderr}) => {
      expect(stdout).to.be.empty
      expect(stderr).to.contain('Enabling maintenance mode for ⬢ myapp... done')
    })
})
