import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('drains:remove', function () {
  afterEach(() => nock.cleanAll())

  it('removes a log drain', async () => {
    nock('https://api.heroku.com:443')
      .delete('/apps/myapp/log-drains/syslog%3A%2F%2Flogs.example.com')
      .reply(200, {url: 'syslog://logs.example.com'})

    const {stderr, stdout} = await runCommand(['drains:remove', '-a', 'myapp', 'syslog://logs.example.com'])

    expect(stdout).to.equal('Successfully removed drain syslog://logs.example.com\n')
    expect(stderr).to.equal('')
  })
})
