import {expect, test} from '@oclif/test'
import {ux} from '@oclif/core'
import * as sinon from 'sinon'

const promptStub = sinon.stub()

describe('labs:disable', function () {
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
    .stderr()
    .do(() => {
      promptStub.onFirstCall().resolves('myapp')
    })
    .nock('https://api.heroku.com', api => api
      .get('/account/features/spaces-strict-tls').reply(404)
      .get('/apps/myapp/features/spaces-strict-tls')
      .reply(200, {
        enabled: true,
        name: 'spaces-strict-tls',
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com',
      })
      .patch('/apps/myapp/features/spaces-strict-tls', {enabled: false}).reply(200),
    )
    .stub(ux, 'prompt', () => Promise.resolve('myapp'))
    .command(['labs:disable', 'spaces-strict-tls', '--app=myapp'])
    .it('warns user of insecure action', ({stderr}) => {
      expect(stderr).to.contain('Insecure Action\nDisabling spaces-strict-tls for myapp...')
    })

  test
    .stderr()
    .do(() => {
      promptStub.onFirstCall().resolves('myapp')
      promptStub.onSecondCall().resolves('notMyApp')
    })
    .stub(ux, 'prompt', () => promptStub)
    .command(['labs:disable', 'spaces-strict-tls', '--app=myapp'])
    .catch(error => {
      expect(error.message).to.equal('Confirmation name did not match app name. Try again.')
    })
    .it('errors when confirmation name does not match')

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
