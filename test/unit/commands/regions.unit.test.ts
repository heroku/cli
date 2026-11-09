import type {Region} from '@heroku/types/3.sdk'

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
  // Full SDK records (`satisfies Region[]`), so the --json snapshots pin the shape users get
  // and a change to the SDK's Region type fails type-checking here.
  const regionData = [
    {
      country: 'Ireland',
      created_at: '2012-11-21T21:44:16Z',
      description: 'Europe',
      id: 'ed30241c-ed8c-4bb6-9714-61953675d0b4',
      locale: 'Dublin',
      name: 'eu',
      private_capable: false,
      provider: {name: 'amazon-web-services', region: 'eu-west-1'},
      updated_at: '2016-08-09T22:03:28Z',
    },
    {
      country: 'United States',
      created_at: '2012-11-21T20:44:16Z',
      description: 'United States',
      id: '59accabd-516d-4f0e-83e6-6e3757701145',
      locale: 'Virginia',
      name: 'us',
      private_capable: false,
      provider: {name: 'amazon-web-services', region: 'us-east-1'},
      updated_at: '2016-08-09T22:03:28Z',
    },
    {
      country: 'United States',
      created_at: '2016-08-09T22:03:28Z',
      description: 'Oregon, United States',
      id: 'dd5ff9d4-0a93-40ce-9d46-ac9047c8b6b8',
      locale: 'Oregon',
      name: 'oregon',
      private_capable: true,
      provider: {name: 'amazon-web-services', region: 'us-west-2'},
      updated_at: '2016-08-09T22:03:28Z',
    },
  ] satisfies Region[]
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
    expect(order).to.not.include(-1)
    expect(order).to.deep.equal([...order].sort((a, b) => a - b))
  })

  describe('--json', function () {
    it('returns the SDK region list in API order', async function () {
      fakePlatform.region.list.resolves([...regionData].reverse())

      const {json, stderr} = await expectJsonSnapshot<Region[]>(this, Regions)

      expect(json.map(r => r.name)).to.deep.equal(['oregon', 'us', 'eu'])
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

      for (const activation of ['flag', 'env'] as const) {
        // eslint-disable-next-line no-await-in-loop
        const {exitCode, json} = await runCommandJson(Regions, [], {activation})

        expect(exitCode, activation).to.equal(1)
        expect(json, activation).to.have.nested.property('error.message', 'service unavailable')
      }
    })
  })
})
