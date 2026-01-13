import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

import removeAllWhitespace from '../../helpers/utils/remove-whitespaces.js'

describe('regions', function () {
  const regionData = [
    {description: 'Europe', name: 'eu', private_capable: false},
    {description: 'United States', name: 'us', private_capable: false},
    {description: 'Oregon, United States', name: 'oregon', private_capable: true},
  ]
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('list regions', async function () {
    api
      .get('/regions')
      .reply(200, regionData)

    const {stdout} = await runCommand(['regions'])

    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('ID       Location                Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('eu       Europe                  Common Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('us       United States           Common Runtime'))
  })

  it('--private', async function () {
    api
      .get('/regions')
      .reply(200, regionData)

    const {stdout} = await runCommand(['regions', '--private'])

    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('ID       Location                Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('oregon   Oregon, United States   Private Spaces'))
  })

  it('--common', async function () {
    api
      .get('/regions')
      .reply(200, regionData)

    const {stdout} = await runCommand(['regions', '--common'])

    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('ID   Location        Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('eu   Europe          Common Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('us   United States   Common Runtime'))
  })

  it('--json', async function () {
    api
      .get('/regions')
      .reply(200, regionData)

    const {stdout} = await runCommand(['regions', '--json'])

    expect(JSON.parse(stdout)[0].name).to.equal('eu')
  })
})
