import {expect, test} from '@oclif/test'

describe('ps:stop', function () {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => api
      .post('/apps/myapp/dynos/web/actions/stop')
      .reply(200),
    )
    .command(['ps:stop', 'web', '-a', 'myapp'])
    .it('stops all web dynos', ({stdout, stderr}) => {
      expect(stdout).to.be.empty
      expect(stderr).to.contains('Stopping web dynos on ⬢ myapp... done\n')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => api
      .post('/apps/myapp/dynos/run.10/actions/stop')
      .reply(200),
    )
    .command(['ps:stop', 'run.10', '-a', 'myapp'])
    .it('stops run.10 dyno', ({stdout, stderr}) => {
      expect(stdout).to.be.empty
      expect(stderr).to.contains('Stopping run.10 dyno on ⬢ myapp... done\n')
    })
})
