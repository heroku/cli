import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'

import ObjectStoreCredentialsIndex from '../../../../../src/commands/object-store/credentials/index.js'
import {
  addon,
  credentialsResponse,
  nonObjectStoreAddon,
} from '../../../../fixtures/object-store/fixtures.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'

describe('object-store:credentials', function () {
  it('throws a not found error when the add-on is not an object store', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [nonObjectStoreAddon])

    const {error} = await runCommand(ObjectStoreCredentialsIndex, [
      'redis-database',
      '--app=myapp',
    ])
    const err = error as Error

    herokuApi.done()
    expect(ansis.strip(err.message)).to.include('Couldn\'t find that addon.')
  })

  describe('when credentials exist', function () {
    it('displays credentials with their prefix, capabilities, and state', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/object-stores/${addon.id}/credentials`)
        .reply(200, credentialsResponse)

      const {stderr, stdout} = await runCommand(ObjectStoreCredentialsIndex, [
        'object-store-crystalline-01234',
        '--app=myapp',
      ])

      herokuApi.done()
      dataApi.done()
      expect(stderr).to.equal('')
      const output = ansis.strip(removeAllWhitespace(stdout))
      expect(output).to.include(removeAllWhitespace('Scoped credentials for object-store-crystalline-01234'))
      expect(output).to.include(removeAllWhitespace('default (default)'))
      expect(output).to.include(removeAllWhitespace('(whole bucket)'))
      expect(output).to.include(removeAllWhitespace('read, write, list, delete'))
      expect(output).to.include(removeAllWhitespace('reports'))
      expect(output).to.include(removeAllWhitespace('reports/'))
      expect(output).to.include(removeAllWhitespace('operational'))
    })
  })

  describe('when no credentials exist', function () {
    it('displays an appropriate message', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/object-stores/${addon.id}/credentials`)
        .reply(200, [])

      const {stderr, stdout} = await runCommand(ObjectStoreCredentialsIndex, [
        'object-store-crystalline-01234',
        '--app=myapp',
      ])

      herokuApi.done()
      dataApi.done()
      expect(stderr).to.equal('')
      expect(ansis.strip(stdout)).to.equal('No credentials found for this object store.\n')
    })
  })
})
