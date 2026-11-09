import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Regions from '../../../src/commands/regions.js'
import {expectJsonSnapshot, runCommandJson} from '../../helpers/json-snapshot.js'
import removeAllWhitespace from '../../helpers/utils/remove-whitespaces.js'

type FakePlatform = {
  region: {list: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    region: {list: sinon.stub()},
  }
}

describe('regions', function () {
  const regionData = [
    {description: 'Europe', name: 'eu', private_capable: false},
    {description: 'United States', name: 'us', private_capable: false},
    {description: 'Oregon, United States', name: 'oregon', private_capable: true},
  ]
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('list regions', async function () {
    fakePlatform.region.list.resolves(regionData)

    const {stdout} = await runCommand(Regions, [])

    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('ID       Location                Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('eu       Europe                  Common Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('us       United States           Common Runtime'))
    expect(fakePlatform.region.list.calledOnceWithExactly()).to.equal(true)
  })

  it('--private', async function () {
    fakePlatform.region.list.resolves(regionData)

    const {stdout} = await runCommand(Regions, ['--private'])

    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('ID       Location                Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('oregon   Oregon, United States   Private Spaces'))
  })

  it('--common', async function () {
    fakePlatform.region.list.resolves(regionData)

    const {stdout} = await runCommand(Regions, ['--common'])

    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('ID   Location        Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('eu   Europe          Common Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('us   United States   Common Runtime'))
  })

  it('sorts the table: common runtime first, then by name', async function () {
    fakePlatform.region.list.resolves([...regionData].reverse())

    const {stdout} = await runCommand(Regions, [])

    const order = ['eu', 'us', 'oregon'].map(name => stdout.indexOf(`${name} `))
    expect(order).to.deep.equal([...order].sort((a, b) => a - b))
  })

  describe('--json', function () {
    it('returns the SDK region list in API order', async function () {
      fakePlatform.region.list.resolves([...regionData].reverse())

      const {json, stderr} = await expectJsonSnapshot(this, Regions)

      expect((json as Array<{name: string}>).map(r => r.name)).to.deep.equal(['oregon', 'us', 'eu'])
      expect(stderr).to.equal('')
    })

    it('--private selects private-capable regions', async function () {
      fakePlatform.region.list.resolves(regionData)

      await expectJsonSnapshot(this, Regions, ['--private'])
    })

    it('--common selects common runtime regions', async function () {
      fakePlatform.region.list.resolves(regionData)

      await expectJsonSnapshot(this, Regions, ['--common'])
    })

    it('returns an empty list when there are no regions', async function () {
      fakePlatform.region.list.resolves([])

      await expectJsonSnapshot(this, Regions)
    })

    it('renders API errors as a JSON error document and exits non-zero', async function () {
      fakePlatform.region.list.rejects(new Error('service unavailable'))

      const {exitCode, json} = await runCommandJson(Regions)

      expect(exitCode).to.equal(1)
      expect(json).to.have.nested.property('error.message', 'service unavailable')
    })
  })
})
