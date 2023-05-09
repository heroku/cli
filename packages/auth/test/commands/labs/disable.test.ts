import {expect, test} from '@oclif/test'

describe('labs:disable', () => {
  test
    .nock('https://api.heroku.com', api => api
      .get('/account')
      .reply(200, {email: 'jeff@heroku.com'})
      .get('/account/features/feature-a')
      .reply(200, {
        enabled: true,
        name: 'feature-a',
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com',
      })
      .patch('/account/features/feature-a', {enabled: false})
      .reply(200),
    )
    .stderr()
    .command(['labs:disable', 'feature-a'])
    .it('disables a user lab feature', () => {
    // to-do: make this work on CI
    // expect(stderr).to.contain('Disabling feature-a for jeff@heroku.com...')
    })

  test
    .nock('https://api.heroku.com', api => api
      .get('/account/features/feature-a').reply(404)
      .get('/apps/myapp/features/feature-a')
      .reply(200, {
        enabled: true,
        name: 'feature-a',
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com',
      })
      .patch('/apps/myapp/features/feature-a', {enabled: false}).reply(200),
    )
    .stderr()
    .command(['labs:disable', 'feature-a', '--app=myapp'])
    .it('disables an app feature', ({stderr}) => {
      expect(stderr).to.contain('Disabling feature-a for myapp...')
    })
})
