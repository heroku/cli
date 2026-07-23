import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import ansis from 'ansis'
import {expect} from 'chai'
import {restore, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/redis/upgrade.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'

const heredoc = tsheredoc.default

describe('heroku redis:upgrade', function () {
  afterEach(function () {
    restore()
  })

  it('# upgrades the redis version', async function () {
    const redisAddon = fixtures.addons['www-redis']
    const resolveByApp = stub().resolves(redisAddon)
    const upgrade = stub().resolves({message: 'Upgrading version now!'})
    stub(HerokuSDK.prototype, 'data').get(() => ({redis: {resolveByApp, upgrade}}))

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'example',
      '--version',
      '6.2',
    ])

    expect(upgrade.calledOnceWithExactly(redisAddon.id, {version: '6.2'})).to.equal(true)
    expectOutput(stderr, heredoc(`
      Requesting upgrade of ${redisAddon.name} to 6.2... Upgrading version now!
    `))
  })

  it('# errors on missing version', async function () {
    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
    ])
    expect(stdout).to.equal('')
    expect(ansis.strip(error?.message || '')).to.equal(heredoc(`
      The following error occurred:
        Missing required flag version
      See more help with --help`))
  })
})
