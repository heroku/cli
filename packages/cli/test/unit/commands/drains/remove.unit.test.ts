import {expect, test} from '@oclif/test'

describe('drains:remove', function () {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => {
      api
        .delete('/apps/myapp/log-drains/syslog%3A%2F%2Flogs.example.com')
        .reply(200, {url: 'syslog://logs.example.com'})
    })
    .command(['drains:remove', '-a', 'myapp', 'syslog://logs.example.com'])
    .it('removes a log drain', ({stderr, stdout}) => {
      expect(stdout).to.equal('Successfully removed drain syslog://logs.example.com\n')
      expect(stderr).to.equal('')
    })
})
