import {runCommand} from '@heroku-cli/test-utils'
import {hux} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import nock from 'nock'
import {restore, SinonStub, stub} from 'sinon'

import LabsDisable from '../../../../src/commands/labs/disable.js'

describe('labs:disable', function () {
  let api: nock.Scope
  let promptStub: SinonStub

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    promptStub = stub()
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
    restore()
  })

  it('disables a user lab feature', async function () {
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

    const {stderr} = await runCommand(LabsDisable, ['feature-a'])

    expect(stderr).to.contain('Disabling feature-a for gandalf@heroku.com...')
  })

  it('warns user of insecure action', async function () {
    stub(hux, 'prompt').resolves('myapp')

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

    const {stderr} = await runCommand(LabsDisable, ['spaces-strict-tls', '--app=myapp'])

    expect(stderr).to.contain('Insecure Action\nDisabling spaces-strict-tls for ⬢ myapp...')
  })

  it('errors when confirmation name does not match', async function () {
    promptStub.onFirstCall().resolves('myapp')
    promptStub.onSecondCall().resolves('notMyApp')
    stub(hux, 'prompt').returns(promptStub as any)

    const {error} = await runCommand(LabsDisable, ['spaces-strict-tls', '--app=myapp'])

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

    const {stderr} = await runCommand(LabsDisable, ['feature-a', '--app=myapp'])

    expect(stderr).to.contain('Disabling feature-a for ⬢ myapp...')
  })
})
