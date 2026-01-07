import {expect} from 'chai'
import {runCommand} from '@oclif/test'
import nock from 'nock'
import removeAllWhitespace from '../../helpers/utils/remove-whitespaces.js'

describe('regions', function () {
  const regionData = [
    {name: 'eu', description: 'Europe', private_capable: false},
    {name: 'us', description: 'United States', private_capable: false},
    {name: 'oregon', description: 'Oregon, United States', private_capable: true},
  ]

  afterEach(function () {
    nock.cleanAll()
  })

  it('list regions', async function () {
    nock('https://api.heroku.com')
      .get('/regions')
      .reply(200, regionData)

    const {stdout} = await runCommand(['regions'])

    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('ID       Location                Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('eu       Europe                  Common Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('us       United States           Common Runtime'))
  })

  it('--private', async function () {
    nock('https://api.heroku.com')
      .get('/regions')
      .reply(200, regionData)

    const {stdout} = await runCommand(['regions', '--private'])

    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('ID       Location                Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('oregon   Oregon, United States   Private Spaces'))
  })

  it('--common', async function () {
    nock('https://api.heroku.com')
      .get('/regions')
      .reply(200, regionData)

    const {stdout} = await runCommand(['regions', '--common'])

    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('ID   Location        Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('eu   Europe          Common Runtime'))
    expect(removeAllWhitespace(stdout)).to.include(removeAllWhitespace('us   United States   Common Runtime'))
  })

  it('--json', async function () {
    nock('https://api.heroku.com')
      .get('/regions')
      .reply(200, regionData)

    const {stdout} = await runCommand(['regions', '--json'])

    expect(JSON.parse(stdout)[0].name).to.equal('eu')
  })
})
