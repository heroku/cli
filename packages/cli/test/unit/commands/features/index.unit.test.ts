import {expect, test} from '@oclif/test'

describe('features', () => {
  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .get('/apps/myapp/features')
        .reply(200, [
          {enabled: true, state: 'general', name: 'feature a', description: 'an app feature'},
        ])
    })
    .command(['features', '--app', 'myapp'])
    .it('shows the app features', ({stdout, stderr}) => {
      expect(stderr).to.equal('')
      expect(stdout).to.equal(`=== App Features ⬢ myapp

[+] feature a  an app feature
`)
    })
})
