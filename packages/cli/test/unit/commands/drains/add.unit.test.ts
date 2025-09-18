import {expect, test} from '@oclif/test'

describe('drains:add', function () {
  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .post('/apps/myapp/log-drains', {url: 'syslog://logs.example.com'})
        .reply(200, {url: 'syslog://logs.example.com'})
    })
    .command(['drains:add', '-a', 'myapp', 'syslog://logs.example.com'])
    .it('adds a log drain', ({stdout, stderr}) => {
      expect(stdout).to.equal('Successfully added drain syslog://logs.example.com\n')
      expect(stderr).to.equal('')
    })
})
