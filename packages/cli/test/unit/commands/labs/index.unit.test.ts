import {expect, test} from '@oclif/test'

describe('labs', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => api
      .get('/account')
      .reply(200, {email: 'jeff@heroku.com'})
      .get('/account/features')
      .reply(200, [
        {enabled: true, name: 'lab feature a', description: 'a user lab feature'},
        {enabled: false, name: 'lab feature b', description: 'a user lab feature'},
      ])
      .get('/apps/myapp/features')
      .reply(200, [
        {enabled: true, name: 'lab feature c', description: 'an app lab feature'},
      ]),
    )
    .command(['labs', 'myapp'])
    .it('shows labs features', ({stdout, stderr}) => {
      expect(stdout).to.equal('=== User Features jeff@heroku.com\n\n[+] lab feature a  a user lab feature\n[ ] lab feature b  a user lab feature\n\n=== App Features ⬢ myapp\n\n[+] lab feature c  an app lab feature\n')
      expect(stderr).to.be.empty
    })
})
