import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import DataPgCredentialsCreate from '../../../../../../src/commands/data/pg/credentials/create.js'
import {
  addon, createCredentialResponse, essentialAddon, legacyEssentialAddon, nonAdvancedAddon,
} from '../../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../../helpers/runCommand.js'

const heredoc = tsheredoc.default

describe('data:pg:credentials:create', function () {
  it('shows error for legacy Essential-tier databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [legacyEssentialAddon])

    try {
      await runCommand(DataPgCredentialsCreate, [
        addon.name!,
        '--app=myapp',
        '--name=my-credential',
      ])
    } catch (error: unknown) {
      const err = error as Error

      herokuApi.done()
      expect(ansis.strip(err.message)).to.equal(
        'You can\'t create custom credentials on Essential-tier databases.',
      )
    }
  })

  it('shows error for Essential-tier databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [essentialAddon])

    try {
      await runCommand(DataPgCredentialsCreate, [
        addon.name!,
        '--app=myapp',
        '--name=my-credential',
      ])
    } catch (error: unknown) {
      const err = error as Error

      herokuApi.done()
      expect(ansis.strip(err.message)).to.equal(
        'You can\'t create custom credentials on Essential-tier databases.',
      )
    }
  })

  it('creates a credential successfully on Advanced-tier databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    const dataApi = nock('https://api.data.heroku.com')
      .post(`/data/postgres/v1/${addon.id}/credentials`)
      .reply(201, createCredentialResponse)

    await runCommand(DataPgCredentialsCreate, [
      'DATABASE',
      '--app=myapp',
      '--name=my-credential',
    ])

    dataApi.done()
    herokuApi.done()

    expect(stderr.output).to.equal(heredoc`
      Creating credential my-credential... done
    `)
    expect(ansis.strip(heredoc(stdout.output))).to.equal(
      ansis.strip(heredoc`
        Attach the credential to the apps you want to use it in with heroku data:pg:attachments:create advanced-horizontal-01234 --credential my-credential -a myapp.
        Define the new grants for the credential in Postgres with heroku pg:psql advanced-horizontal-01234 -a myapp.

      `),
    )
  })

  it('creates a credential successfully on legacy non-Essential tier databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [nonAdvancedAddon])

    const dataApi = nock('https://api.data.heroku.com')
      .post(`/postgres/v0/databases/${essentialAddon.id}/credentials`)
      .reply(201, createCredentialResponse)

    await runCommand(DataPgCredentialsCreate, [
      'DATABASE',
      '--app=myapp',
      '--name=my-credential',
    ])

    dataApi.done()
    herokuApi.done()

    expect(stderr.output).to.equal(heredoc`
      Creating credential my-credential... done
    `)
    expect(ansis.strip(heredoc(stdout.output))).to.equal(
      ansis.strip(heredoc`
        Attach the credential to the apps you want to use it in with heroku addons:attach standard-database --credential my-credential -a myapp.
        Define the new grants for the credential in Postgres with heroku pg:psql standard-database -a myapp.

      `),
    )
  })

  it('handles API errors gracefully on Advanced-tier databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])

    const dataApi = nock('https://api.data.heroku.com')
      .post(`/data/postgres/v1/${addon.id}/credentials`)
      .reply(422, {
        id: 'unprocessable_entity',
        message: heredoc`
          my-credential on ${addon.name} already exists.
          Credential names must be unique within the database. Choose another name and try again.
        `,
      })

    try {
      await runCommand(DataPgCredentialsCreate, [
        'DATABASE',
        '--app=myapp',
        '--name=my-credential',
      ])
    } catch (error: unknown) {
      const err = error as Error
      expect(ansis.strip(err.message)).to.include(
        heredoc`
          my-credential on ${addon.name} already exists.
          Credential names must be unique within the database. Choose another name and try again.
        `,
      )
    }

    herokuApi.done()
    dataApi.done()
  })

  it('handles API errors gracefully on legacy non-Essential tier databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [nonAdvancedAddon])

    const dataApi = nock('https://api.data.heroku.com')
      .post(`/postgres/v0/databases/${nonAdvancedAddon.id}/credentials`)
      .reply(422, {
        id: 'unprocessable_entity',
        message: heredoc`
          my-credential on ${nonAdvancedAddon.name} already exists.
          Credential names must be unique within the database. Choose another name and try again.
        `,
      })

    try {
      await runCommand(DataPgCredentialsCreate, [
        'DATABASE',
        '--app=myapp',
        '--name=my-credential',
      ])
    } catch (error: unknown) {
      const err = error as Error
      expect(ansis.strip(err.message)).to.include(
        heredoc`
          my-credential on ${nonAdvancedAddon.name} already exists.
          Credential names must be unique within the database. Choose another name and try again.
        `,
      )
    }

    herokuApi.done()
    dataApi.done()
  })
})
