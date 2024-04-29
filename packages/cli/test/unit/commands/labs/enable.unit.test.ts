import {expect, test} from '@oclif/test'

describe('labs:enable', function () {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => api
      .get('/account')
      .reply(200, {email: 'jeff@heroku.com'})
      .get('/account/features/feature-a')
      .reply(200, {
        enabled: false,
        name: 'feature-a',
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com',
      })
      .patch('/account/features/feature-a', {enabled: true})
      .reply(200),
    )
    .command(['labs:enable', 'feature-a'])
    .it('enables a user lab feature', ({stdout, stderr}) => {
      expect(stdout).to.be.empty
      expect(stderr).to.equal('Enabling feature-a for jeff@heroku.com...\nEnabling feature-a for jeff@heroku.com... done\n')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => api
      .get('/account/features/feature-a').reply(404)
      .get('/apps/myapp/features/feature-a')
      .reply(200, {
        enabled: false,
        name: 'feature-a',
        description: 'an app labs feature',
        doc_url: 'https://devcenter.heroku.com',
      })
      .patch('/apps/myapp/features/feature-a', {enabled: true}).reply(200),
    )
    .command(['labs:enable', 'feature-a', '-a', 'myapp'])
    .it('enables an app feature', ({stdout, stderr}) => {
      expect(stdout).to.be.empty
      expect(stderr).to.contain('Enabling feature-a for myapp... done\n')
    })
})
