import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import DataPgCredentialsIndex from '../../../../../../src/commands/data/pg/credentials/index.js'
import {
  addon,
  advancedCredentialsAttachmentsResponse,
  advancedCredentialsResponse,
  nonAdvancedAddon,
  nonAdvancedCredentialsAttachmentsResponse,
} from '../../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../../helpers/runCommand.js'
import removeAllWhitespace from '../../../../../helpers/utils/remove-whitespaces.js'

const heredoc = tsheredoc.default

describe('data:pg:credentials:index', function () {
  it('shows error for non-advanced databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [nonAdvancedAddon])
      .get(`/addons/${addon.id}/addon-attachments`)
      .reply(200, nonAdvancedCredentialsAttachmentsResponse)

    try {
      await runCommand(DataPgCredentialsIndex, [addon.name!, '--app=myapp'])
    } catch (error: unknown) {
      const err = error as Error

      herokuApi.done()
      expect(ansis.strip(err.message)).to.equal(
        'You can only use this command on Advanced-tier databases.\n'
          + 'Use heroku pg:credentials DATABASE -a myapp instead.',
      )
    }
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

    await runCommand(DataPgCredentialsIndex, [
      'DATABASE',
      '--app=myapp',
    ])

    dataApi.done()
    herokuApi.done()

    const actual = removeAllWhitespace(ansis.strip(stdout.output))
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

    try {
      await runCommand(DataPgCredentialsIndex, [
        'DATABASE',
        '--app=myapp',
      ])
    } catch (error: unknown) {
      const err = error as Error
      expect(ansis.strip(err.message)).to.include(`Addon ${addon.id} not found`)
    }

    herokuApi.done()
    dataApi.done()
  })
})
