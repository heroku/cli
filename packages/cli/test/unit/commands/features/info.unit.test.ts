import {expect, test} from '@oclif/test'

describe('features:info', function () {
  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .get('/apps/myapp/features/feature-a')
        .reply(200, {name: 'myfeature', description: 'the description', doc_url: 'https://devcenter.heroku.com', enabled: true})
    })
    .command(['features:info', '-a', 'myapp', 'feature-a'])
    .it('shows feature info', ({stderr, stdout}) => {
      expect(stdout).to.eq(`=== myfeature

Description: the description
Docs:        https://devcenter.heroku.com
Enabled:     true
`)
      expect(stderr).to.equal('')
    })
})
