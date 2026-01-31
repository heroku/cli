import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

describe('sessions:index', function () {
  let api: nock.Scope
  const exampleSession1 = {
    description: 'B Session @ 166.176.184.223',
    id: 'aBcD1234-129f-42d2-854b-dEf123abc123',
  }
  const exampleSession2 = {
    description: 'A Session @ 166.176.184.223',
    id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
  }

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('lists the sessions alphabetically by description', async function () {
    api
      .get('/oauth/sessions')
      .reply(200, [exampleSession1, exampleSession2])

    const {stdout} = await runCommand(['sessions'])

    const actual = removeAllWhitespace(stdout)
    const expected = removeAllWhitespace(
      ' A Session @ 166.176.184.223 f6e8d969-129f-42d2-854b-c2eca9d5a42e \n'
      + ' B Session @ 166.176.184.223 aBcD1234-129f-42d2-854b-dEf123abc123 \n',
    )
    expect(actual).to.include(expected)
  })

  context('with json flag', function () {
    it('lists the sessions alphabetically as json', async function () {
      api
        .get('/oauth/sessions')
        .reply(200, [exampleSession1, exampleSession2])

      const {stdout} = await runCommand(['sessions', '--json'])

      const sessionJSON = JSON.parse(stdout)

      expect(sessionJSON[0]).to.eql(exampleSession2)
      expect(sessionJSON[1]).to.eql(exampleSession1)
    })
  })

  context('without sessions', function () {
    it('shows no sessions message', async function () {
      api
        .get('/oauth/sessions')
        .reply(200, [])

      const {stdout} = await runCommand(['sessions'])

      expect(stdout).to.equal('No OAuth sessions.\n')
    })
  })
})
