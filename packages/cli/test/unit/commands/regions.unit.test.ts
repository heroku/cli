import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import removeAllWhitespace from '../../helpers/utils/remove-whitespaces.js'

describe('regions', function () {
  const regions = [
    {name: 'eu', description: 'Europe', private_capable: false},
    {name: 'us', description: 'United States', private_capable: false},
    {name: 'oregon', description: 'Oregon, United States', private_capable: true},
  ]

  beforeEach(function () {
    nock('https://api.heroku.com')
      .get('/regions')
      .reply(200, regions)
  })

  afterEach(function () {
    nock.cleanAll()
  })

  it('list regions', async function () {
    const {stdout} = await runCommand(['regions'])
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('ID       Location                Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('eu       Europe                  Common Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('us       United States           Common Runtime'))
  })

  it('--private', async function () {
    const {stdout} = await runCommand(['regions', '--private'])
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('ID       Location                Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('oregon   Oregon, United States   Private Spaces'))
  })

  it('--common', async function () {
    const {stdout} = await runCommand(['regions', '--common'])
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('ID   Location        Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('eu   Europe          Common Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('us   United States   Common Runtime'))
  })

  it('--json', async function () {
    const {stdout} = await runCommand(['regions', '--json'])
    expect(JSON.parse(stdout)[0].name).to.equal('eu')
  })
})
