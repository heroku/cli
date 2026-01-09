import {hux} from '@heroku/heroku-cli-util'
import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'

describe('labs:disable', function () {
  let api: nock.Scope
  let promptStub: sinon.SinonStub

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    promptStub = sinon.stub()
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
    sinon.restore()
  })

  // TODO: make this work on CI
  it.skip('disables a user lab feature', async function () {
    api
      .get('/account')
      .reply(200, {email: 'gandalf@heroku.com'})
      .get('/account/features/feature-a')
      .reply(200, {
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com',
        enabled: true,
        name: 'feature-a',
      })
      .patch('/account/features/feature-a', {enabled: false})
      .reply(200)

    const {stderr} = await runCommand(['labs:disable', 'feature-a'])

    expect(stderr).to.contain('Disabling feature-a for gandalf@heroku.com...')
  })

  it('warns user of insecure action', async function () {
    sinon.stub(hux, 'prompt').resolves('myapp')

    api
      .get('/account/features/spaces-strict-tls')
      .reply(404)
      .get('/apps/myapp/features/spaces-strict-tls')
      .reply(200, {
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com',
        enabled: true,
        name: 'spaces-strict-tls',
      })
      .patch('/apps/myapp/features/spaces-strict-tls', {enabled: false})
      .reply(200)

    const {stderr} = await runCommand(['labs:disable', 'spaces-strict-tls', '--app=myapp'])

    expect(stderr).to.contain('Insecure Action\nDisabling spaces-strict-tls for myapp...')
  })

  it('errors when confirmation name does not match', async function () {
    promptStub.onFirstCall().resolves('myapp')
    promptStub.onSecondCall().resolves('notMyApp')
    sinon.stub(hux, 'prompt').returns(promptStub as any)

    const {error} = await runCommand(['labs:disable', 'spaces-strict-tls', '--app=myapp'])

    expect(error?.message).to.equal('Confirmation name did not match app name. Try again.')
  })

  it('disables an app feature', async function () {
    api
      .get('/account/features/feature-a')
      .reply(404)
      .get('/apps/myapp/features/feature-a')
      .reply(200, {
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com',
        enabled: true,
        name: 'feature-a',
      })
      .patch('/apps/myapp/features/feature-a', {enabled: false})
      .reply(200)

    const {stderr} = await runCommand(['labs:disable', 'feature-a', '--app=myapp'])

    expect(stderr).to.contain('Disabling feature-a for myapp...')
  })
})
