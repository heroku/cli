import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'

import ObjectStoreInfoCommand from '../../../../src/commands/object-store/info.js'
import {
  addon,
  nonObjectStoreAddon,
  objectStoreInfoNoMetricsResponse,
  objectStoreInfoResponse,
} from '../../../fixtures/object-store/fixtures.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

describe('object-store:info', function () {
  it('throws a not found error when the add-on is not an object store', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [nonObjectStoreAddon])

    const {error} = await runCommand(ObjectStoreInfoCommand, [
      'redis-database',
      '--app=myapp',
    ])
    const err = error as Error

    herokuApi.done()
    expect(ansis.strip(err.message)).to.include('Couldn\'t find that addon.')
  })

  it('shows store-level details with storage footprint', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    const dataApi = nock('https://api.data.heroku.com')
      .get(`/object-stores/${addon.id}`)
      .reply(200, objectStoreInfoResponse)

    const {stderr, stdout} = await runCommand(ObjectStoreInfoCommand, [
      'object-store-crystalline-01234',
      '--app=myapp',
    ])

    herokuApi.done()
    dataApi.done()
    expect(stderr).to.equal('')
    const output = ansis.strip(removeAllWhitespace(stdout))
    expect(output).to.include(removeAllWhitespace('object-store-crystalline-01234'))
    expect(ansis.strip(stdout)).to.include('myapp')
    expect(output).to.include(removeAllWhitespace('Plan: Standard'))
    expect(output).to.include(removeAllWhitespace('Status: Available'))
    expect(output).to.include(removeAllWhitespace('Region: virginia'))
    expect(output).to.include(removeAllWhitespace('Storage: 2 KB / 7 objects'))
    expect(output).to.include(removeAllWhitespace('Session TTL: 12h'))
  })

  it('does not surface any per-credential detail', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    const dataApi = nock('https://api.data.heroku.com')
      .get(`/object-stores/${addon.id}`)
      .reply(200, objectStoreInfoResponse)

    const {stdout} = await runCommand(ObjectStoreInfoCommand, [
      'object-store-crystalline-01234',
      '--app=myapp',
    ])

    herokuApi.done()
    dataApi.done()
    const output = ansis.strip(stdout).toLowerCase()
    expect(output).to.not.include('credential')
    expect(output).to.not.include('prefix')
    expect(output).to.not.include('capabilities')
  })

  it('shows a placeholder when storage metrics have not been collected', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])
    const dataApi = nock('https://api.data.heroku.com')
      .get(`/object-stores/${addon.id}`)
      .reply(200, objectStoreInfoNoMetricsResponse)

    const {stdout} = await runCommand(ObjectStoreInfoCommand, [
      'object-store-crystalline-01234',
      '--app=myapp',
    ])

    herokuApi.done()
    dataApi.done()
    const output = ansis.strip(removeAllWhitespace(stdout))
    expect(output).to.include(removeAllWhitespace('Storage: No data yet'))
  })
})
