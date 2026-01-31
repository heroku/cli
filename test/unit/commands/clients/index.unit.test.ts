import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

describe('clients', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  describe('with clients', function () {
    const exampleClient1 = {
      id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
      name: 'awesome',
      redirect_uri: 'https://myapp.com',
    }

    it('lists the clients', async function () {
      api
        .get('/oauth/clients')
        .reply(200, [exampleClient1])

      const {stdout} = await runCommand(['clients'])

      const actual = removeAllWhitespace(stdout)
      const expected = removeAllWhitespace('awesome f6e8d969-129f-42d2-854b-c2eca9d5a42e https://myapp.com')
      expect(actual).to.include(expected)
    })

    it('lists the clients as json', async function () {
      api
        .get('/oauth/clients')
        .reply(200, [exampleClient1])

      const {stdout} = await runCommand(['clients', '--json'])

      expect(JSON.parse(stdout)[0]).to.contain(exampleClient1)
    })
  })

  describe('without clients', function () {
    it('shows no clients message', async function () {
      api
        .get('/oauth/clients')
        .reply(200, [])

      const {stdout} = await runCommand(['clients'])

      expect(stdout).to.equal('No OAuth clients.\n')
    })
  })
})
