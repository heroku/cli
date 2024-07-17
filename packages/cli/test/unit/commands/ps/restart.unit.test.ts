import {expect, test} from '@oclif/test'

describe('ps:restart', function () {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => api
      .delete('/apps/myapp/dynos')
      .reply(200),
    )
    .command(['ps:restart', '-a', 'myapp'])
    .it('restarts all dynos', ({stdout, stderr}) => {
      expect(stdout).to.be.empty
      expect(stderr).to.contains('Restarting dynos on ⬢ myapp... done\n')
    })
})
