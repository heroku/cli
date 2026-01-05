import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

describe('authorizations', function () {
  afterEach(() => nock.cleanAll())

  const exampleAuthorization1 = {
    description: 'b description',
    id: 'aBcD1234-129f-42d2-854b-dEf123abc123',
    scope: ['global'],
  }
  const exampleAuthorization2 = {
    description: 'awesome',
    id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
    scope: ['app', 'user'],
  }

  it('lists the authorizations alphabetically by description', async () => {
    nock('https://api.heroku.com:443')
      .get('/oauth/authorizations')
      .reply(200, [exampleAuthorization1, exampleAuthorization2])

    const {stdout} = await runCommand(['authorizations'])

    const actual = removeAllWhitespace(stdout)
    const expected = removeAllWhitespace(`
      awesome       f6e8d969-129f-42d2-854b-c2eca9d5a42e app,user
      b description aBcD1234-129f-42d2-854b-dEf123abc123 global`)
    expect(actual).to.include(expected)
  })

  context('with json flag', function () {
    it('lists the authorizations alphabetically as json', async () => {
      nock('https://api.heroku.com:443')
        .get('/oauth/authorizations')
        .reply(200, [exampleAuthorization1, exampleAuthorization2])

      const {stdout} = await runCommand(['authorizations', '--json'])

      const authJSON = JSON.parse(stdout)
      expect(authJSON[0]).to.eql(exampleAuthorization2)
      expect(authJSON[1]).to.eql(exampleAuthorization1)
    })
  })

  context('without authorizations', function () {
    it('shows no authorizations message', async () => {
      nock('https://api.heroku.com:443')
        .get('/oauth/authorizations')
        .reply(200, [])

      const {stdout} = await runCommand(['authorizations'])

      expect(stdout).to.equal('No OAuth authorizations.\n')
    })
  })
})
