import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import LabsDisable from '../../../../src/commands/labs/disable.js'

describe('labs:disable', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
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
