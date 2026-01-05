import * as Heroku from '@heroku-cli/schema'
import {expect} from 'chai'
import {formatDistanceToNow, addSeconds} from 'date-fns'
import {captureOutput} from '@oclif/test'
import {display} from '../../../../src/lib/authorizations/authorizations.js'

describe('display', function () {
  const authId = 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'
  const authDesc = 'a cool auth'

  context('with an auth', function () {
    const auth: Heroku.OAuthAuthorization = {
      id: authId,
      description: authDesc,
      scope: ['global', 'app'],
    }

    it('prints the styled authorization', async () => {
      const {stdout} = await captureOutput(async () => {
        display(auth)
      })

      expect(stdout).to.contain(`ID:          ${authId}\n`)
      expect(stdout).to.contain('Scope:       global,app\n')
      expect(stdout).to.contain(`Description: ${authDesc}\n`)

      expect(stdout).to.contain('Client:      <none>\n')
      expect(stdout).to.not.contain('Redirect URI')

      expect(stdout).to.not.contain('Token')
      expect(stdout).to.not.contain('Expires at')
      expect(stdout).to.not.contain('Updated at')
    })
  })

  context('with an auth access token', function () {
    const updatedAt = new Date(0)
    const auth: Heroku.OAuthAuthorization = {
      id: authId,
      description: authDesc,
      scope: ['global', 'app'],
      updated_at: `${updatedAt}`,
      access_token: {
        token: '1234abcd-129f-42d2-854b-EfGhIjKlMn12',
        expires_in: 10000,
      },
    }

    it('prints the styled authorization with access token info', async () => {
      const {stdout} = await captureOutput(async () => {
        display(auth)
      })

      const expirationDate = addSeconds(new Date(), 10000)
      expect(stdout).to.contain(`ID:          ${authId}\n`)
      expect(stdout).to.contain('Scope:       global,app\n')
      expect(stdout).to.contain('Description: a cool auth\n')

      expect(stdout).to.contain('Client:      <none>\n')
      expect(stdout).to.not.contain('Redirect URI')

      expect(stdout).to.contain(`ID:          ${authId}\n`)
      expect(stdout).to.contain(`Updated at:  ${updatedAt}`)
      expect(stdout).to.contain(`(${formatDistanceToNow(updatedAt)} ago)`)

      expect(stdout).to.contain(`Expires at:  ${expirationDate}`)
      expect(stdout).to.contain(`(in ${formatDistanceToNow(expirationDate)})`)
    })
  })

  context('with a client', function () {
    const client: Heroku.OAuthClient = {
      redirect_uri: 'https://myapp.com',
      name: 'a cool client',
    }

    const auth: Heroku.OAuthAuthorization = {
      id: authId,
      description: authDesc,
      client,
    }

    it('prints the styled authorization with client info', async () => {
      const {stdout} = await captureOutput(async () => {
        display(auth)
      })

      expect(stdout).to.contain(`ID:           ${authId}\n`)
      expect(stdout).to.contain(`Description:  ${authDesc}\n`)
      expect(stdout).to.not.contain('Scope')

      expect(stdout).to.contain('Client:       a cool client\n')
      expect(stdout).to.contain('Redirect URI: https://myapp.com\n')

      expect(stdout).to.not.contain('Token')
      expect(stdout).to.not.contain('Expires at')
      expect(stdout).to.not.contain('Updated at')
    })
  })
})
