import {expect, test} from '@oclif/test'

describe('maintenance', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => api
      .get('/apps/myapp')
      .reply(200, {maintenance: true}),
    )
    .command(['maintenance', '-a', 'myapp'])
    .it('shows that maintenance is on', ({stdout, stderr}) => {
      expect(stdout).to.equal('on\n')
      expect(stderr).to.be.empty
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => api
      .get('/apps/myapp')
      .reply(200, {maintenance: false}),
    )
    .command(['maintenance', '-a', 'myapp'])
    .it('shows that maintenance is off', ({stdout, stderr}) => {
      expect(stdout).to.equal('off\n')
      expect(stderr).to.be.empty
    })
})
