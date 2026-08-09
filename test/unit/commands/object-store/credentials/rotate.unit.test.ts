import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'

import ObjectStoreCredentialsRotate from '../../../../../src/commands/object-store/credentials/rotate.js'
import {addon} from '../../../../fixtures/object-store/fixtures.js'

describe('object-store:credentials:rotate', function () {
  it('rotates the default credential without revoking active sessions', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    const dataApi = nock('https://api.data.heroku.com')
      .post(`/object-stores/${addon.id}/credentials/default/rotate`, {revoke_active: false})
      .reply(200, {message: 'Rotating credential default.'})

    const {stderr} = await runCommand(ObjectStoreCredentialsRotate, [
      'object-store-crystalline-01234',
      '--app=myapp',
      '--confirm=myapp',
    ])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stderr)).to.include('Rotating credential default')
  })

  it('rotates a named credential and revokes active sessions', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    const dataApi = nock('https://api.data.heroku.com')
      .post(`/object-stores/${addon.id}/credentials/reports/rotate`, {revoke_active: true})
      .reply(200, {message: 'Rotating credential reports and revoking active sessions.'})

    const {stderr} = await runCommand(ObjectStoreCredentialsRotate, [
      'object-store-crystalline-01234',
      '--app=myapp',
      '--name=reports',
      '--revoke-active',
      '--confirm=myapp',
    ])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stderr)).to.include('Rotating credential reports')
  })
})
