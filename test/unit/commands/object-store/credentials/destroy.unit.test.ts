import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'

import ObjectStoreCredentialsDestroy from '../../../../../src/commands/object-store/credentials/destroy.js'
import {
  addon,
  attachmentsResponse,
  emptyAttachmentsResponse,
} from '../../../../fixtures/object-store/fixtures.js'

describe('object-store:credentials:destroy', function () {
  it('refuses to destroy the default credential', async function () {
    const {error} = await runCommand(ObjectStoreCredentialsDestroy, [
      'object-store-crystalline-01234',
      '--app=myapp',
      '--name=default',
      '--confirm=myapp',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal('You can\'t destroy the default credential.')
  })

  it('refuses to destroy a credential that is still attached', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])
      .get(`/addons/${addon.id}/addon-attachments`)
      .reply(200, attachmentsResponse)

    const {error} = await runCommand(ObjectStoreCredentialsDestroy, [
      'object-store-crystalline-01234',
      '--app=myapp',
      '--name=reports',
      '--confirm=myapp',
    ])
    const err = error as Error

    herokuApi.done()
    const message = ansis.strip(err.message)
    expect(message).to.include('You must detach the credential reports from the app')
    expect(message).to.include('myapp before destroying it.')
  })

  it('destroys an unattached credential', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])
      .get(`/addons/${addon.id}/addon-attachments`)
      .reply(200, emptyAttachmentsResponse)
    const dataApi = nock('https://api.data.heroku.com')
      .delete(`/object-stores/${addon.id}/credentials/reports`)
      .reply(200, {message: 'Deleted credential reports.'})

    const {stderr} = await runCommand(ObjectStoreCredentialsDestroy, [
      'object-store-crystalline-01234',
      '--app=myapp',
      '--name=reports',
      '--confirm=myapp',
    ])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stderr)).to.include('Destroying credential reports')
  })
})
