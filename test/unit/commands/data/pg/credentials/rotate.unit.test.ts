import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import DataPgCredentialsRotate from '../../../../../../src/commands/data/pg/credentials/rotate.js'
import {
  addon,
  advancedCredentialsAttachmentsResponse,
  advancedCredentialsMultipleAttachmentsResponse,
  advancedCredentialsResponse,
  essentialAddon,
  essentialCredentialsResponse,
  legacyEssentialAddon,
  nonAdvancedAddon,
  nonAdvancedCredentialsAttachmentsResponse,
  nonAdvancedCredentialsMultipleAttachmentsResponse,
  nonAdvancedCredentialsResponse,
} from '../../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../../helpers/runCommand.js'

const heredoc = tsheredoc.default

describe('data:pg:credentials:rotate', function () {
  let confirmStub: sinon.SinonStub

  beforeEach(function () {
    confirmStub = sinon.stub(DataPgCredentialsRotate.prototype, 'confirmCommand').resolves()
  })

  afterEach(function () {
    sinon.restore()
  })

  context('Advanced-tier databases', function () {
    it('rotates a specific credential attached to a single app successfully', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, advancedCredentialsAttachmentsResponse)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)
        .post(`/data/postgres/v1/${addon.id}/credentials/analyst/rotate`)
        .reply(202, {})

      await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ])

      dataApi.done()
      herokuApi.done()

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the analyst credential.')
      expect(warningMessage).to.include(
        'This action resets connections older than 30 minutes, and uses a temporary rotation username during the process.',
      )
      expect(warningMessage).to.include('This command will affect the app ⬢ myapp.')
      expect(stderr.output).to.equal(heredoc`
        Rotating analyst on ⛁ advanced-horizontal-01234... done
      `)
      expect(stdout.output).to.equal('')
    })

    it('rotates a specific credential attached to multiple apps successfully', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, advancedCredentialsMultipleAttachmentsResponse)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)
        .post(`/data/postgres/v1/${addon.id}/credentials/analyst/rotate`)
        .reply(202, {})

      await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ])

      dataApi.done()
      herokuApi.done()

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the analyst credential.')
      expect(warningMessage).to.include(
        'This action resets connections older than 30 minutes, and uses a temporary rotation username during the process.',
      )
      expect(warningMessage).to.include('This command will affect the apps ⬢ myapp, ⬢ myapp2.')
      expect(stderr.output).to.equal(heredoc`
        Rotating analyst on ⛁ advanced-horizontal-01234... done
      `)
      expect(stdout.output).to.equal('')
    })

    it('rotates owner credential by default when no name specified', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, advancedCredentialsAttachmentsResponse)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)
        .post(`/data/postgres/v1/${addon.id}/credentials/u2vi1nt40t3mcq/rotate`)
        .reply(202, {})

      await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
      ])

      dataApi.done()
      herokuApi.done()

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the u2vi1nt40t3mcq credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
      expect(warningMessage).to.include('This command will affect the app ⬢ myapp.')
      expect(stderr.output).to.equal(heredoc`
        Rotating u2vi1nt40t3mcq on ⛁ advanced-horizontal-01234... done
      `)
      expect(stdout.output).to.equal('')
    })

    it('rotates all credentials successfully', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, advancedCredentialsAttachmentsResponse)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)
        .post(`/data/postgres/v1/${addon.id}/rotate_credentials`)
        .reply(202, {})

      await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--all',
      ])

      dataApi.done()
      herokuApi.done()

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the passwords for all credentials including the owner (u2vi1nt40t3mcq) credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')

      expect(stderr.output).to.equal(heredoc`
        Rotating all credentials on ⛁ advanced-horizontal-01234... done
      `)
      expect(stdout.output).to.equal('')
    })

    it('rotates specific credential with force flag', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, advancedCredentialsAttachmentsResponse)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)
        .post(`/data/postgres/v1/${addon.id}/credentials/analyst/rotate`, {
          forced: true,
        })
        .reply(202, {})

      await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
        '--force',
      ])

      dataApi.done()
      herokuApi.done()

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the analyst credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
      expect(warningMessage).to.include('You can\'t access any followers lagging in replication until they\'re caught up.')
      expect(warningMessage).to.include('This command will affect the app ⬢ myapp.')
      expect(stderr.output).to.equal(heredoc`
        Rotating analyst on ⛁ advanced-horizontal-01234... done
      `)
      expect(stdout.output).to.equal('')
    })

    it('rotates all credentials with force flag', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, advancedCredentialsAttachmentsResponse)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)
        .post(`/data/postgres/v1/${addon.id}/rotate_credentials`)
        .reply(202, {})

      await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--all',
        '--force',
      ])

      dataApi.done()
      herokuApi.done()

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re force rotating the passwords for all credentials including the owner (u2vi1nt40t3mcq) credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
      expect(warningMessage).to.include('You can\'t access any followers lagging in replication until they\'re caught up.')
      expect(stderr.output).to.equal(heredoc`
        Rotating all credentials on ⛁ advanced-horizontal-01234... done
      `)
      expect(stdout.output).to.equal('')
    })
  })

  context('Non-Advanced-tier databases', function () {
    it('shows error for legacy essential databases when --name does not equal default', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [legacyEssentialAddon])

      await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ]).catch(error => {
        herokuApi.done()
        expect(error.message).to.equal('Legacy Essential-tier databases do not support named credentials.')
      })
    })

    it('shows error for essential databases when --name does not equal default', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [essentialAddon])

      await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ]).catch(error => {
        herokuApi.done()
        expect(error.message).to.equal('Essential-tier databases do not support named credentials.')
      })
    })

    it('rotates a specific credential attached to a single app successfully', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])
        .get(`/addons/${nonAdvancedAddon.id}/addon-attachments`)
        .reply(200, nonAdvancedCredentialsAttachmentsResponse)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/postgres/v0/databases/${nonAdvancedAddon.id}/credentials`)
        .reply(200, nonAdvancedCredentialsResponse)
        .post(`/postgres/v0/databases/${nonAdvancedAddon.id}/credentials/analyst/credentials_rotation`)
        .reply(202, {})

      await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ])

      dataApi.done()
      herokuApi.done()

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the analyst credential.')
      expect(warningMessage).to.include(
        'This action resets connections older than 30 minutes, and uses a temporary rotation username during the process.',
      )
      expect(warningMessage).to.include('This command will affect the app ⬢ myapp.')
      expect(stderr.output).to.equal(heredoc`
        Rotating analyst on ⛁ standard-database... done
      `)
      expect(stdout.output).to.equal('')
    })

    it('rotates a specific credential attached to multiple apps successfully', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])
        .get(`/addons/${nonAdvancedAddon.id}/addon-attachments`)
        .reply(200, nonAdvancedCredentialsMultipleAttachmentsResponse)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/postgres/v0/databases/${nonAdvancedAddon.id}/credentials`)
        .reply(200, nonAdvancedCredentialsResponse)
        .post(`/postgres/v0/databases/${nonAdvancedAddon.id}/credentials/analyst/credentials_rotation`)
        .reply(202, {})

      await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
      ])

      dataApi.done()
      herokuApi.done()

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the analyst credential.')
      expect(warningMessage).to.include(
        'This action resets connections older than 30 minutes, and uses a temporary rotation username during the process.',
      )
      expect(warningMessage).to.include('This command will affect the apps ⬢ myapp, ⬢ myapp2.')
      expect(stderr.output).to.equal(heredoc`
        Rotating analyst on ⛁ standard-database... done
      `)
      expect(stdout.output).to.equal('')
    })

    it('rotates default credential by default when no name specified', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])
        .get(`/addons/${nonAdvancedAddon.id}/addon-attachments`)
        .reply(200, nonAdvancedCredentialsAttachmentsResponse)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/postgres/v0/databases/${nonAdvancedAddon.id}/credentials`)
        .reply(200, nonAdvancedCredentialsResponse)
        .post(`/postgres/v0/databases/${nonAdvancedAddon.id}/credentials/default/credentials_rotation`)
        .reply(202, {})

      await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
      ])

      dataApi.done()
      herokuApi.done()

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the default credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
      expect(warningMessage).to.include('This command will affect the app ⬢ myapp.')
      expect(stderr.output).to.equal(heredoc`
        Rotating default on ⛁ standard-database... done
      `)
      expect(stdout.output).to.equal('')
    })

    it('rotates all credentials successfully', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])
        .get(`/addons/${nonAdvancedAddon.id}/addon-attachments`)
        .reply(200, nonAdvancedCredentialsAttachmentsResponse)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/postgres/v0/databases/${nonAdvancedAddon.id}/credentials`)
        .reply(200, nonAdvancedCredentialsResponse)
        .post(`/postgres/v0/databases/${nonAdvancedAddon.id}/credentials_rotation`)
        .reply(202, {})

      await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--all',
      ])

      dataApi.done()
      herokuApi.done()

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the passwords for all credentials including the default credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')

      expect(stderr.output).to.equal(heredoc`
        Rotating all credentials on ⛁ standard-database... done
      `)
      expect(stdout.output).to.equal('')
    })

    it('rotates specific credential with force flag', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])
        .get(`/addons/${nonAdvancedAddon.id}/addon-attachments`)
        .reply(200, nonAdvancedCredentialsAttachmentsResponse)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/postgres/v0/databases/${nonAdvancedAddon.id}/credentials`)
        .reply(200, nonAdvancedCredentialsResponse)
        .post(`/postgres/v0/databases/${nonAdvancedAddon.id}/credentials/analyst/credentials_rotation`, {
          forced: true,
        })
        .reply(202, {})

      await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--name=analyst',
        '--force',
      ])

      dataApi.done()
      herokuApi.done()

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the analyst credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
      expect(warningMessage).to.include('You can\'t access any followers lagging in replication until they\'re caught up.')
      expect(warningMessage).to.include('This command will affect the app ⬢ myapp.')
      expect(stderr.output).to.equal(heredoc`
        Rotating analyst on ⛁ standard-database... done
      `)
      expect(stdout.output).to.equal('')
    })

    it('rotates all credentials with force flag', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])
        .get(`/addons/${nonAdvancedAddon.id}/addon-attachments`)
        .reply(200, nonAdvancedCredentialsAttachmentsResponse)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/postgres/v0/databases/${nonAdvancedAddon.id}/credentials`)
        .reply(200, nonAdvancedCredentialsResponse)
        .post(`/postgres/v0/databases/${nonAdvancedAddon.id}/credentials_rotation`)
        .reply(202, {})

      await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
        '--all',
        '--force',
      ])

      dataApi.done()
      herokuApi.done()

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true

      expect(warningMessage).to.include('You\'re force rotating the passwords for all credentials including the default credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
      expect(warningMessage).to.include('You can\'t access any followers lagging in replication until they\'re caught up.')
      expect(stderr.output).to.equal(heredoc`
        Rotating all credentials on ⛁ standard-database... done
      `)
      expect(stdout.output).to.equal('')
    })

    it('successfully rotates essential-tier database credential', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [essentialAddon])
        .get(`/addons/${nonAdvancedAddon.id}/addon-attachments`)
        .reply(200, nonAdvancedCredentialsAttachmentsResponse)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/postgres/v0/databases/${nonAdvancedAddon.id}/credentials`)
        .reply(200, essentialCredentialsResponse)
        .post(`/postgres/v0/databases/${nonAdvancedAddon.id}/credentials/default/credentials_rotation`)
        .reply(202, {})

      await runCommand(DataPgCredentialsRotate, [
        'DATABASE',
        '--app=myapp',
      ])

      dataApi.done()
      herokuApi.done()

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      console.log(warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the default credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
      expect(warningMessage).to.include('This command will affect the app ⬢ myapp.')
      expect(stderr.output).to.equal(heredoc`
        Rotating default on ⛁ advanced-horizontal-01234... done
      `)
      expect(stdout.output).to.equal('')
    })
  })

  context('error handling', function () {
    it('shows error when no active credentials found', async function () {
      const emptyCredentialsResponse = {items: []}

      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, advancedCredentialsAttachmentsResponse)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, emptyCredentialsResponse)

      try {
        await runCommand(DataPgCredentialsRotate, [
          'DATABASE',
          '--app=myapp',
        ])
      } catch (error: unknown) {
        const err = error as Error
        expect(ansis.strip(err.message)).to.equal('There are no credentials on the database ⛁ advanced-horizontal-01234.')
      }

      dataApi.done()
      herokuApi.done()

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
    })

    it('handles API errors gracefully with specific credential', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, advancedCredentialsAttachmentsResponse)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)
        .post(`/data/postgres/v1/${addon.id}/credentials/analyst/rotate`)
        .reply(404, {
          id: 'not_found',
          message: 'Credential not found.',
        })

      try {
        await runCommand(DataPgCredentialsRotate, [
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

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the password for the analyst credential.')
      expect(warningMessage).to.include(
        'This action resets connections older than 30 minutes, and uses a temporary rotation username during the process.',
      )
      expect(warningMessage).to.include('This command will affect the app ⬢ myapp.')
    })

    it('handles API errors gracefully with all credentials', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, advancedCredentialsAttachmentsResponse)

      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${addon.id}/credentials`)
        .reply(200, advancedCredentialsResponse)
        .post(`/data/postgres/v1/${addon.id}/rotate_credentials`)
        .reply(500, {
          id: 'internal_server_error',
          message: 'Internal server error.',
        })

      try {
        await runCommand(DataPgCredentialsRotate, [
          'DATABASE',
          '--app=myapp',
          '--all',
        ])
      } catch (error: unknown) {
        const err = error as Error
        expect(ansis.strip(err.message)).to.include('Internal server error.')
      }

      dataApi.done()
      herokuApi.done()

      const warningMessage = ansis.strip(confirmStub.firstCall.args[0].warningMessage)
      expect(confirmStub.calledOnce).to.be.true
      expect(warningMessage).to.include('You\'re rotating the passwords for all credentials including the owner (u2vi1nt40t3mcq) credential.')
      expect(warningMessage).to.include('This action resets connections and applications using the credential.')
    })
  })
})
