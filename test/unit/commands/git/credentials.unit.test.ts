import {expect} from 'chai'
import mockStdin from 'mock-stdin'

import {stubCredentialManager} from '../../../helpers/credential-manager-stub.js'
import {GitCredentials as Credentials} from '../../../../src/commands/git/credentials.js'
import {runCommand} from '../../../helpers/run-command.js'

describe('git:credentials', function () {
  let stdin: mockStdin.MockSTDIN

  beforeEach(function () {
    stdin = mockStdin.stdin()
  })

  afterEach(function () {
    stdin.restore()
  })

  it('errors if no app given', async function () {
    const {error} = await runCommand(Credentials, [])

    expect(error?.message).to.contain('Missing 1 required arg')
  })

  describe('get operation', function () {
    it('outputs credentials', async function () {
      stubCredentialManager({
        getAuth: async () => ({account: 'test@example.com', token: 'test-token'}),
      })

      setTimeout(() => {
        stdin.send('protocol=https\nhost=git.heroku.com\n\n')
      }, 0)

      const {stdout, error} = await runCommand(Credentials, ['get'])

      expect(error).to.be.undefined
      expect(stdout).to.equal('protocol=https\nhost=git.heroku.com\nusername=heroku\npassword=test-token\n')
    })

    it('does not output credentials for non-Heroku hosts', async function () {
      stubCredentialManager({
        getAuth: async () => ({account: 'test@example.com', token: 'test-token'}),
      })

      setTimeout(() => {
        stdin.send('protocol=https\nhost=github.com\n\n')
      }, 0)

      const {stdout, error} = await runCommand(Credentials, ['get'])

      expect(error).to.be.undefined
      expect(stdout).to.equal('')
    })

    it('does not output credentials when protocol is not https', async function () {
      stubCredentialManager({
        getAuth: async () => ({account: 'test@example.com', token: 'test-token'}),
      })

      setTimeout(() => {
        stdin.send('protocol=http\nhost=git.heroku.com\n\n')
      }, 0)

      const {stdout, error} = await runCommand(Credentials, ['get'])

      expect(error).to.be.undefined
      expect(stdout).to.equal('')
    })

    it('errors when not logged in', async function () {
      stubCredentialManager({
        getAuth: async () => ({account: undefined, token: undefined}),
      })

      setTimeout(() => {
        stdin.send('protocol=https\nhost=git.heroku.com\n\n')
      }, 0)

      const {error} = await runCommand(Credentials, ['get'])

      expect(error?.message).to.contain('not logged in')
    })
  })

  describe('store operation', function () {
    it('accepts input without error', async function () {
      setTimeout(() => {
        stdin.send('protocol=https\nhost=git.heroku.com\nusername=heroku\npassword=test-token\n\n')
      }, 0)

      const {error, stdout} = await runCommand(Credentials, ['store'])

      expect(error).to.be.undefined
      expect(stdout).to.equal('')
    })
  })

  describe('erase operation', function () {
    it('accepts input without error', async function () {
      setTimeout(() => {
        stdin.send('protocol=https\nhost=git.heroku.com\n\n')
      }, 0)

      const {error, stdout} = await runCommand(Credentials, ['erase'])

      expect(error).to.be.undefined
      expect(stdout).to.equal('')
    })
  })
})
