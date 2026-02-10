import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import type {AdvancedCredentialInfo} from '../../../../../../src/lib/data/types.js'

import DataPgCredentialsUrl from '../../../../../../src/commands/data/pg/credentials/url.js'
import {
  addon,
  advancedCredentialsResponse,
  essentialAddon,
  inactiveCredentialResponse,
  legacyEssentialAddon,
  nonAdvancedAddon,
  nonAdvancedCredentialsResponse,
  nonAdvancedInactiveCredentialResponse,
} from '../../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../../helpers/runCommand.js'

const heredoc = tsheredoc.default

describe('data:pg:credentials:url', function () {
  it('shows error for Legacy Essential-tier databases with a custom credential name', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [legacyEssentialAddon])

    try {
      await runCommand(DataPgCredentialsUrl, [
        'DATABASE',
        '--app=myapp',
        '--name=non-default-credential',
      ])
    } catch (error: unknown) {
      const err = error as Error

      herokuApi.done()
      expect(ansis.strip(err.message)).to.equal('Essential-tier databases don\'t support named credentials.')
    }
  })

  it('shows error for Essential-tier databases with a custom credential name', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [essentialAddon])

    try {
      await runCommand(DataPgCredentialsUrl, [
        'DATABASE',
        '--app=myapp',
        '--name=non-default-credential',
      ])
    } catch (error: unknown) {
      const err = error as Error

      herokuApi.done()
      expect(ansis.strip(err.message)).to.equal('Essential-tier databases don\'t support named credentials.')
    }
  })

  describe('Advanced-tier databases', function () {
    it('shows error when no active credentials found', async function () {
      const emptyCredentialsResponse = {items: []}

      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, emptyCredentialsResponse)

      try {
        await runCommand(DataPgCredentialsUrl, [
          'DATABASE',
          '--app=myapp',
        ])
      } catch (error: unknown) {
        const err = error as Error

        dataApi.done()
        herokuApi.done()
        expect(ansis.strip(err.message)).to.equal('There are no active credentials on the database ⛁ advanced-horizontal-01234.')
      }
    })

    it('shows error when specified credential isn\'t active', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)
        .get(`/data/postgres/v1/${addon.id}/credentials/analyst`)
        .reply(200, inactiveCredentialResponse)

      try {
        await runCommand(DataPgCredentialsUrl, [
          'DATABASE',
          '--app=myapp',
          '--name=analyst',
        ])
      } catch (error: unknown) {
        const err = error as Error

        dataApi.done()
        herokuApi.done()
        expect(ansis.strip(err.message)).to.equal('The credential analyst isn\'t active on the database ⛁ advanced-horizontal-01234.')
      }
    })

    it('shows owner credential URL by default when no name specified', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)
        .get(`/data/postgres/v1/${addon.id}/credentials/u2vi1nt40t3mcq`)
        .reply(200, advancedCredentialsResponse.items[0])

      await runCommand(DataPgCredentialsUrl, [
        'DATABASE',
        '--app=myapp',
      ])

      dataApi.done()
      herokuApi.done()

      expect(stderr.output).to.equal('')
      expect(ansis.strip(heredoc(stdout.output))).to.equal(
        // cspell:disable
        ansis.strip(heredoc`
          === Connection information for u2vi1nt40t3mcq credential:

          Connection info string:
          "dbname=d4w8akz45kmru7 host=cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com port=5432 user=u2vi1nt40t3mcq password=secret1 sslmode=require"

          Connection URL:
          postgres://u2vi1nt40t3mcq:secret1@cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com:5432/d4w8akz45kmru7

        `),
        // cspell:enable
      )
    })

    it('shows specific credential URL when name is specified', async function () {
      // cspell:disable
      const analystCredentialResponse: AdvancedCredentialInfo = {
        database: 'd4w8akz45kmru7',
        host: 'cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com',
        id: '9eb68dd8-5b3e-410a-890a-e44de90356d3',
        name: 'analyst',
        port: '5432',
        roles: [
          {
            password: 'secret2',
            state: 'active',
            user: 'analyst',
          },
        ],
        state: 'active',
        type: 'additional',
      }
      // cspell:enable

      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)
        .get(`/data/postgres/v1/${addon.id}/credentials/analyst`)
        .reply(200, analystCredentialResponse)

      await runCommand(DataPgCredentialsUrl, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ])

      dataApi.done()
      herokuApi.done()

      expect(stderr.output).to.equal('')
      expect(ansis.strip(heredoc(stdout.output))).to.equal(
        // cspell:disable
        ansis.strip(heredoc`
          === Connection information for analyst credential:

          Connection info string:
          "dbname=d4w8akz45kmru7 host=cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com port=5432 user=analyst password=secret2 sslmode=require"

          Connection URL:
          postgres://analyst:secret2@cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com:5432/d4w8akz45kmru7

        `),
        // cspell:enable
      )
    })

    it('handles API errors gracefully', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)
        .get(`/data/postgres/v1/${addon.id}/credentials/analyst`)
        .reply(404, {
          id: 'not_found',
          message: 'Credential not found.',
        })

      try {
        await runCommand(DataPgCredentialsUrl, [
          'DATABASE',
          '--app=myapp',
          '--name=analyst',
        ])
      } catch (error: unknown) {
        const err = error as Error
        expect(ansis.strip(err.message)).to.include('Credential not found.')
      }

      dataApi.done()
      herokuApi.done()
    })
  })

  describe('Non-Advanced-tier databases', function () {
    it('shows error when specified credential isn\'t active', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/postgres/v0/databases/${addon.id}/credentials/analyst`)
        .reply(200, nonAdvancedInactiveCredentialResponse)

      try {
        await runCommand(DataPgCredentialsUrl, [
          'DATABASE',
          '--app=myapp',
          '--name=analyst',
        ])
      } catch (error: unknown) {
        const err = error as Error

        dataApi.done()
        herokuApi.done()
        expect(ansis.strip(err.message)).to.equal('The credential analyst isn\'t active on the database ⛁ standard-database.')
      }
    })

    it('shows default credential URL by default when no name specified', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/postgres/v0/databases/${addon.id}/credentials/default`)
        .reply(200, nonAdvancedCredentialsResponse[0])

      await runCommand(DataPgCredentialsUrl, [
        'DATABASE',
        '--app=myapp',
      ])

      dataApi.done()
      herokuApi.done()

      expect(stderr.output).to.equal('')
      expect(ansis.strip(heredoc(stdout.output))).to.equal(
        // cspell:disable
        ansis.strip(heredoc`
          === Connection information for default credential:

          Connection info string:
          "dbname=d4w8akz45kmru7 host=cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com port=5432 user=u2vi1nt40t3mcq password=secret1 sslmode=require"

          Connection URL:
          postgres://u2vi1nt40t3mcq:secret1@cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com:5432/d4w8akz45kmru7

        `),
        // cspell:enable
      )
    })

    it('shows specific credential URL when name is specified', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/postgres/v0/databases/${addon.id}/credentials/analyst`)
        .reply(200, nonAdvancedCredentialsResponse[1])

      await runCommand(DataPgCredentialsUrl, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ])

      dataApi.done()
      herokuApi.done()

      expect(stderr.output).to.equal('')
      expect(ansis.strip(heredoc(stdout.output))).to.equal(
        // cspell:disable
        ansis.strip(heredoc`
          === Connection information for analyst credential:

          Connection info string:
          "dbname=d4w8akz45kmru7 host=cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com port=5432 user=analyst password=secret2 sslmode=require"

          Connection URL:
          postgres://analyst:secret2@cc3hipc68aca1l.cluster-caqt9jk3hth8.us-east-1.rds.amazonaws.com:5432/d4w8akz45kmru7

        `),
        // cspell:enable
      )
    })

    it('handles API errors gracefully', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/postgres/v0/databases/${addon.id}/credentials/analyst`)
        .reply(404, {
          id: 'not_found',
          message: 'Not found.',
        })

      try {
        await runCommand(DataPgCredentialsUrl, [
          'DATABASE',
          '--app=myapp',
          '--name=analyst',
        ])
      } catch (error: unknown) {
        const err = error as Error
        expect(ansis.strip(err.message)).to.include('Not found.')
      }

      dataApi.done()
      herokuApi.done()
    })
  })
})
