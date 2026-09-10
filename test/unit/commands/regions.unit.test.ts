import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Regions from '../../../src/commands/regions.js'
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

  it('--json', async function () {
    fakePlatform.region.list.resolves(regionData)

    const {stdout} = await runCommand(Regions, ['--json'])

    expect(JSON.parse(stdout)[0].name).to.equal('eu')
  })
})
