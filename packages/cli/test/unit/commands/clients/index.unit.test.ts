import {expect} from 'chai'
import {runCommand} from '@oclif/test'
import nock from 'nock'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

describe('clients', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  describe('with clients', function () {
    const exampleClient1 = {
      name: 'awesome',
      id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
      redirect_uri: 'https://myapp.com',
    }

    it('lists the clients', async function () {
      nock('https://api.heroku.com:443')
        .get('/oauth/clients')
        .reply(200, [exampleClient1])

      const {stdout} = await runCommand(['clients'])

      const actual = removeAllWhitespace(stdout)
      const expected = removeAllWhitespace('awesome f6e8d969-129f-42d2-854b-c2eca9d5a42e https://myapp.com')
      expect(actual).to.include(expected)
    })

    it('lists the clients as json', async function () {
      nock('https://api.heroku.com:443')
        .get('/oauth/clients')
        .reply(200, [exampleClient1])

      const {stdout} = await runCommand(['clients', '--json'])

      expect(JSON.parse(stdout)[0]).to.contain(exampleClient1)
    })
  })

  describe('without clients', function () {
    it('shows no clients message', async function () {
      nock('https://api.heroku.com:443')
        .get('/oauth/clients')
        .reply(200, [])

      const {stdout} = await runCommand(['clients'])

      expect(stdout).to.equal('No OAuth clients.\n')
    })
  })
})
