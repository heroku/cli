import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import DataPgCredentialsDestroy from '../../../../../../src/commands/data/pg/credentials/destroy.js'
import {
  addon,
  advancedCredentialsAttachmentsResponse,
  advancedCredentialsMultipleAttachmentsResponse,
  advancedCredentialsResponse,
  essentialAddon,
  legacyEssentialAddon,
  nonAdvancedAddon,
  nonAdvancedCredentialsAttachmentsResponse,
  nonAdvancedCredentialsMultipleAttachmentsResponse,
} from '../../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../../helpers/runCommand.js'

const heredoc = tsheredoc.default

describe('data:pg:credentials:destroy', function () {
  it('shows error for Legacy Essential-tier databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [legacyEssentialAddon])

    try {
      await runCommand(DataPgCredentialsDestroy, [
        addon.name!,
        '--app=myapp',
        '--name=default',
        '--confirm=myapp',
      ])
    } catch (error: unknown) {
      const err = error as Error

      herokuApi.done()
      expect(ansis.strip(err.message)).to.equal(
        'You can\'t destroy the default credential.',
      )
    }
  })

  it('shows error for Essential-tier databases', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [essentialAddon])

    try {
      await runCommand(DataPgCredentialsDestroy, [
        addon.name!,
        '--app=myapp',
        '--name=default',
        '--confirm=myapp',
      ])
    } catch (error: unknown) {
      const err = error as Error

      herokuApi.done()
      expect(ansis.strip(err.message)).to.equal(
        'You can\'t destroy the default credential.',
      )
    }
  })

  it('shows error for non-Advanced-tier databases when trying to destroy default credential', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [nonAdvancedAddon])

    try {
      await runCommand(DataPgCredentialsDestroy, [
        addon.name!,
        '--app=myapp',
        '--name=default',
        '--confirm=myapp',
      ])
    } catch (error: unknown) {
      const err = error as Error

      herokuApi.done()
      expect(ansis.strip(err.message)).to.equal(
        'You can\'t destroy the default credential.',
      )
    }
  })

  it('shows error for Advanced-tier databases when trying to destroy owner credential', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [addon])
      .get(`/addons/${addon.id}/addon-attachments`)
      .reply(200, advancedCredentialsAttachmentsResponse)

    const dataApi = nock('https://api.data.heroku.com')
      .get(`/data/postgres/v1/${addon.id}/credentials`)
      .reply(200, advancedCredentialsResponse)

    try {
      await runCommand(DataPgCredentialsDestroy, [
        'DATABASE',
        '--app=myapp',
        '--name=u2vi1nt40t3mcq', // owner credential name
        '--confirm=myapp',
      ])
    } catch (error: unknown) {
      const err = error as Error

      dataApi.done()
      herokuApi.done()
      expect(ansis.strip(err.message)).to.equal("You can't destroy the owner credential.")
    }
  })

  describe('Advanced-tier databases', function () {
    it('shows an error when credential is attached to a single app', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, advancedCredentialsAttachmentsResponse)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)

      try {
        await runCommand(DataPgCredentialsDestroy, [
          'DATABASE',
          '--app=myapp',
          '--name=analyst', // credential that has attachments
          '--confirm=myapp',
        ])
      } catch (error: unknown) {
        const err = error as Error

        dataApi.done()
        herokuApi.done()
        expect(ansis.strip(err.message)).to.equal(
          'You must detach the credential analyst from the app ⬢ myapp before destroying it.',
        )
      }
    })

    it('shows an error when credential is attached to multiple apps', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, advancedCredentialsMultipleAttachmentsResponse)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)

      try {
        await runCommand(DataPgCredentialsDestroy, [
          'DATABASE',
          '--app=myapp',
          '--name=analyst', // credential that has attachments
          '--confirm=myapp',
        ])
      } catch (error: unknown) {
        const err = error as Error

        dataApi.done()
        herokuApi.done()
        expect(ansis.strip(err.message)).to.equal(
          'You must detach the credential analyst from the apps ⬢ myapp, ⬢ myapp2 before destroying it.',
        )
      }
    })

    it('destroys a credential successfully', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, [])

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)
        .delete(`/data/postgres/v1/${addon.id}/credentials/my-credential`)
        .reply(204)

      await runCommand(DataPgCredentialsDestroy, [
        'DATABASE',
        '--app=myapp',
        '--name=my-credential',
        '--confirm=myapp',
      ])

      dataApi.done()
      herokuApi.done()

      expect(stderr.output).to.equal(heredoc`
        Destroying credential my-credential... done
      `)
      expect(ansis.strip(heredoc(stdout.output))).to.equal(
        ansis.strip(heredoc`
          We destroyed the credential my-credential in ⛁ advanced-horizontal-01234.
          Database objects owned by my-credential will be assigned to the owner credential.
        `),
      )
    })

    it('handles API errors gracefully', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, [])

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)
        .delete(`/data/postgres/v1/${addon.id}/credentials/my-credential`)
        .reply(404, {
          id: 'not_found',
          message: 'Not found.',
        })

      try {
        await runCommand(DataPgCredentialsDestroy, [
          'DATABASE',
          '--app=myapp',
          '--name=my-credential',
          '--confirm=myapp',
        ])
      } catch (error: unknown) {
        const err = error as Error
        expect(ansis.strip(err.message)).to.include('Not found.')
      }

      dataApi.done()
      herokuApi.done()
    })
  })

  describe('Non-Advanced-tier databases', function () {
    it('shows an error when credential is attached to a single app', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])
        .get(`/addons/${nonAdvancedAddon.id}/addon-attachments`)
        .reply(200, nonAdvancedCredentialsAttachmentsResponse)

      try {
        await runCommand(DataPgCredentialsDestroy, [
          'DATABASE',
          '--app=myapp',
          '--name=analyst', // credential that has attachments
          '--confirm=myapp',
        ])
      } catch (error: unknown) {
        const err = error as Error

        herokuApi.done()
        expect(ansis.strip(err.message)).to.equal(
          'You must detach the credential analyst from the app ⬢ myapp before destroying it.',
        )
      }
    })

    it('shows an error when credential is attached to multiple apps', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])
        .get(`/addons/${nonAdvancedAddon.id}/addon-attachments`)
        .reply(200, nonAdvancedCredentialsMultipleAttachmentsResponse)

      try {
        await runCommand(DataPgCredentialsDestroy, [
          'DATABASE',
          '--app=myapp',
          '--name=analyst', // credential that has attachments
        ])
      } catch (error: unknown) {
        const err = error as Error

        herokuApi.done()
        expect(ansis.strip(err.message)).to.equal(
          'You must detach the credential analyst from the apps ⬢ myapp, ⬢ myapp2 before destroying it.',
        )
      }
    })

    it('destroys a credential successfully', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])
        .get(`/addons/${nonAdvancedAddon.id}/addon-attachments`)
        .reply(200, [])

      const dataApi = nock('https://api.data.heroku.com')
        .delete(`/postgres/v0/databases/${nonAdvancedAddon.name}/credentials/my-credential`)
        .reply(204)

      await runCommand(DataPgCredentialsDestroy, [
        'DATABASE',
        '--app=myapp',
        '--name=my-credential',
        '--confirm=myapp',
      ])

      dataApi.done()
      herokuApi.done()

      expect(stderr.output).to.equal(heredoc`
        Destroying credential my-credential... done
      `)
      expect(ansis.strip(heredoc(stdout.output))).to.equal(
        ansis.strip(heredoc`
          We destroyed the credential my-credential in ⛁ standard-database.
          Database objects owned by my-credential will be assigned to the default credential.
        `),
      )
    })

    it('handles API errors gracefully', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])
        .get(`/addons/${nonAdvancedAddon.id}/addon-attachments`)
        .reply(200, [])

      const dataApi = nock('https://api.data.heroku.com')
        .delete(`/postgres/v0/databases/${nonAdvancedAddon.name}/credentials/my-credential`)
        .reply(404, {
          id: 'not_found',
          message: 'Not found.',
        })

      try {
        await runCommand(DataPgCredentialsDestroy, [
          'DATABASE',
          '--app=myapp',
          '--name=my-credential',
          '--confirm=myapp',
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
