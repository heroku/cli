import {runCommand} from '@heroku-cli/test-utils'
import {hux} from '@heroku/heroku-cli-util'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {restore, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import DataPgCredentialsIndex from '../../../../../../src/commands/data/pg/credentials/index.js'
import {
  addon,
  advancedCredentialsAttachmentsResponse,
  advancedCredentialsResponse,
  nonAdvancedAddon,
  nonAdvancedCredentialsAttachmentsResponse,
} from '../../../../../fixtures/data/pg/fixtures.js'
import removeAllWhitespace from '../../../../../helpers/utils/remove-whitespaces.js'

const heredoc = tsheredoc.default

describe('data:pg:credentials:index', function () {
  afterEach(function () {
    restore()
  })

  it('shows error for non-advanced databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [nonAdvancedAddon])
      .get(`/addons/${addon.id}/addon-attachments`)
      .reply(200, nonAdvancedCredentialsAttachmentsResponse)

    const {error} = await runCommand(DataPgCredentialsIndex, [addon.name!, '--app=myapp'])
    const err = error as Error

    herokuApi.done()
    expect(ansis.strip(err.message)).to.equal('You can only use this command on Advanced-tier databases.\n'
          + 'Use heroku pg:credentials DATABASE -a myapp instead.')
  })

  it('displays credentials with attachments in a table', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])
      .get(`/addons/${addon.id}/addon-attachments`)
      .reply(200, advancedCredentialsAttachmentsResponse)

    const dataApi = nock('https://api.data.heroku.com')
      .get(`/data/postgres/v1/${addon.id}/credentials`)
      .reply(200, advancedCredentialsResponse)

    const {stdout} = await runCommand(DataPgCredentialsIndex, [
      'DATABASE',
      '--app=myapp',
    ])

    dataApi.done()
    herokuApi.done()

    const actual = removeAllWhitespace(ansis.strip(stdout))
    const expectedHeader = removeAllWhitespace('Credential              Type       State')
    const expectedContent = removeAllWhitespace(heredoc`
      u2vi1nt40t3mcq          owner      active 
      └─ as DATABASE                           

      analyst                 additional active 
      └─ as DATABASE_ANALYST                   
    `)
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expectedContent)
  })

  it('handles API errors gracefully', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])
      .get(`/addons/${addon.id}/addon-attachments`)
      .reply(200, advancedCredentialsAttachmentsResponse)

    const dataApi = nock('https://api.data.heroku.com')
      .get(`/data/postgres/v1/${addon.id}/credentials`)
      .reply(404, {
        id: 'not_found',
        message: `Addon ${addon.id} not found`,
      })

    const {error} = await runCommand(DataPgCredentialsIndex, [
      'DATABASE',
      '--app=myapp',
    ])
    const err = error as Error
    expect(ansis.strip(err.message)).to.include(`Addon ${addon.id} not found`)

    herokuApi.done()
    dataApi.done()
  })

  it('passes no-wrap option through to table rendering', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])
      .get(`/addons/${addon.id}/addon-attachments`)
      .reply(200, advancedCredentialsAttachmentsResponse)

    const dataApi = nock('https://api.data.heroku.com')
      .get(`/data/postgres/v1/${addon.id}/credentials`)
      .reply(200, advancedCredentialsResponse)

    const tableStub = stub(hux, 'table')
    await runCommand(DataPgCredentialsIndex, ['DATABASE', '--app=myapp', '--no-wrap'])

    const callArgs = tableStub.firstCall.args
    expect(callArgs[2]).to.include({maxWidth: 'none', overflow: 'truncate'})

    herokuApi.done()
    dataApi.done()
  })
})
