import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import * as sinon from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/links/index.js'
import * as fixtures from '../../../../fixtures/addons/fixtures.js'
import {MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

const heredoc = tsheredoc

describe('pg:links', function () {
  const appName = 'myapp'
  const addon = fixtures.addons['www-db']
  const redisLink = {
    created_at: '100',
    name: 'redis-link-1',
    remote: {
      attachment_name: 'REDIS',
      name: 'redis-001',
    },
  }
  let listByApp: sinon.SinonStub
  let sdkMock: MockSDK

  beforeEach(function () {
    listByApp = sinon.stub()
    sdkMock = mockSDKData({link: {listByApp}})
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('shows links', async function () {
    listByApp.resolves([{addon, links: [redisLink]}])

    const {stdout} = await runCommand(Cmd, [
      '--app',
      appName,
    ])
    expectOutput(stdout, heredoc(`
      === ⛁ ${addon.name}

       * redis-link-1
      created_at: 100
      remote:     REDIS (⛁ redis-001)
    `))
    expect(listByApp.calledOnce).to.equal(true)
    expect(listByApp.firstCall.args).to.deep.equal([appName, undefined])
  })

  it('shows links when args are present', async function () {
    listByApp.resolves([{addon, links: [redisLink]}])

    const {stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'test-database',
    ])
    expectOutput(stdout, heredoc(`
      === ⛁ ${addon.name}

       * redis-link-1
      created_at: 100
      remote:     REDIS (⛁ redis-001)
    `))
    expect(listByApp.calledOnceWithExactly('myapp', 'test-database')).to.equal(true)
  })

  it('errors when the app has no databases', async function () {
    listByApp.resolves([])

    const {error} = await runCommand(Cmd, ['--app', appName])

    expect(ansis.strip(error?.message ?? '')).to.equal('No databases on ⬢ myapp')
  })

  it('lists every database in attachment order, separated by a blank line', async function () {
    const other = fixtures.addons['dwh-db']
    listByApp.resolves([{addon, links: [redisLink]}, {addon: other, links: []}])

    const {stdout} = await runCommand(Cmd, ['--app', appName])

    expectOutput(stdout, heredoc(`
      === ⛁ ${addon.name}

       * redis-link-1
      created_at: 100
      remote:     REDIS (⛁ redis-001)

      === ⛁ ${other.name}

      No data sources are linked into this database
    `))
  })
})
