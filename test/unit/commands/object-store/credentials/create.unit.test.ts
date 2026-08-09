import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'

import ObjectStoreCredentialsCreate from '../../../../../src/commands/object-store/credentials/create.js'
import {
  addon,
  reportsCredential,
} from '../../../../fixtures/object-store/fixtures.js'

describe('object-store:credentials:create', function () {
  it('creates a scoped credential and prints the attach hint', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    const dataApi = nock('https://api.data.heroku.com')
      .post(`/object-stores/${addon.id}/credentials`, {
        capabilities: ['read', 'list'],
        key_prefix: 'reports/',
        name: 'reports',
      })
      .reply(201, reportsCredential)

    const {stderr, stdout} = await runCommand(ObjectStoreCredentialsCreate, [
      'object-store-crystalline-01234',
      '--app=myapp',
      '--name=reports',
      '--capability=read',
      '--capability=list',
      '--prefix=reports/',
    ])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stderr)).to.include('Creating credential reports')
    const output = ansis.strip(stdout)
    expect(output).to.include('Created credential reports (read, list on reports/)')
    expect(output).to.include('heroku object-store:attachments:create object-store-crystalline-01234 --credential reports --app myapp')
  })

  it('defaults the prefix to the whole bucket when omitted', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    const dataApi = nock('https://api.data.heroku.com')
      .post(`/object-stores/${addon.id}/credentials`, {
        capabilities: ['read'],
        key_prefix: '',
        name: 'whole-bucket',
      })
      .reply(201, {
        ...reportsCredential, capabilities: ['read'], key_prefix: '', name: 'whole-bucket',
      })

    const {stdout} = await runCommand(ObjectStoreCredentialsCreate, [
      'object-store-crystalline-01234',
      '--app=myapp',
      '--name=whole-bucket',
      '--capability=read',
    ])

    herokuApi.done()
    dataApi.done()
    expect(ansis.strip(stdout)).to.include('Created credential whole-bucket (read).')
  })

  it('rejects an unknown capability', async function () {
    const {error} = await runCommand(ObjectStoreCredentialsCreate, [
      'object-store-crystalline-01234',
      '--app=myapp',
      '--name=reports',
      '--capability=teleport',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.include('Expected --capability=teleport to be one of')
  })
})
