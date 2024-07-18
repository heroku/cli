import {expect, test} from '@oclif/test'

describe('maintenance:off', function () {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => api
      .patch('/apps/myapp', {maintenance: false})
      .reply(200),
    )
    .command(['maintenance:off', '-a', 'myapp'])
    .it('turns maintenance mode off', ({stdout, stderr}) => {
      expect(stdout).to.be.empty
      expect(stderr).to.contain('Disabling maintenance mode for ⬢ myapp... done')
    })
})
