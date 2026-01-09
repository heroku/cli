import * as Heroku from '@heroku-cli/schema'
import {captureOutput} from '@oclif/test'
import {expect} from 'chai'
import {addSeconds, formatDistanceToNow} from 'date-fns'

import {display} from '../../../../src/lib/authorizations/authorizations.js'

describe('display', function () {
  const authId = 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'
  const authDesc = 'a cool auth'

  context('with an auth', function () {
    const auth: Heroku.OAuthAuthorization = {
      description: authDesc,
      id: authId,
      scope: ['global', 'app'],
    }

    it('prints the styled authorization', async function () {
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
      access_token: {
        expires_in: 10000,
        token: '1234abcd-129f-42d2-854b-EfGhIjKlMn12',
      },
      description: authDesc,
      id: authId,
      scope: ['global', 'app'],
      updated_at: `${updatedAt}`,
    }

    it('prints the styled authorization with access token info', async function () {
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
      name: 'a cool client',
      redirect_uri: 'https://myapp.com',
    }

    const auth: Heroku.OAuthAuthorization = {
      client,
      description: authDesc,
      id: authId,
    }

    it('prints the styled authorization with client info', async function () {
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
