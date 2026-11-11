import {OauthAuthorization} from '@heroku/types/3.sdk'
import ansis from 'ansis'
import {expect} from 'chai'
import {addSeconds, formatDistanceToNow} from 'date-fns'

import {format} from '../../../../src/lib/authorizations/authorizations.js'

describe('format', function () {
  const authId = 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'
  const authDesc = 'a cool auth'

  context('with an auth', function () {
    const auth = {
      description: authDesc,
      id: authId,
      scope: ['global', 'app'],
    } as OauthAuthorization

    it('formats the styled authorization', function () {
      const output = `${ansis.strip(format(auth))}\n`

      expect(output).to.contain(`ID:          ${authId}\n`)
      expect(output).to.contain('Scope:       global,app\n')
      expect(output).to.contain(`Description: ${authDesc}\n`)

      expect(output).to.contain('Client:      <none>\n')
      expect(output).to.not.contain('Redirect URI')

      expect(output).to.not.contain('Token')
      expect(output).to.not.contain('Expires at')
      expect(output).to.not.contain('Updated at')
    })
  })

  context('with an auth access token', function () {
    const updatedAt = new Date(0)
    const auth = {
      access_token: {
        expires_in: 10_000,
        token: '1234abcd-129f-42d2-854b-EfGhIjKlMn12',
      },
      description: authDesc,
      id: authId,
      scope: ['global', 'app'],
      updated_at: `${updatedAt}`,
    } as OauthAuthorization

    it('formats the styled authorization with access token info', function () {
      const output = `${ansis.strip(format(auth))}\n`

      const expirationDate = addSeconds(new Date(), 10_000)
      expect(output).to.contain(`ID:          ${authId}\n`)
      expect(output).to.contain('Scope:       global,app\n')
      expect(output).to.contain('Description: a cool auth\n')

      expect(output).to.contain('Client:      <none>\n')
      expect(output).to.not.contain('Redirect URI')

      expect(output).to.contain(`ID:          ${authId}\n`)
      expect(output).to.contain(`Updated at:  ${updatedAt}`)
      expect(output).to.contain(`(${formatDistanceToNow(updatedAt)} ago)`)

      expect(output).to.contain(`Expires at:  ${expirationDate}`)
      expect(output).to.contain(`(in ${formatDistanceToNow(expirationDate)})`)
    })
  })

  context('with a client', function () {
    const client = {
      name: 'a cool client',
      redirect_uri: 'https://myapp.com',
    }

    const auth = {
      client,
      description: authDesc,
      id: authId,
    } as OauthAuthorization

    it('formats the styled authorization with client info', function () {
      const output = `${ansis.strip(format(auth))}\n`

      expect(output).to.contain(`ID:           ${authId}\n`)
      expect(output).to.contain(`Description:  ${authDesc}\n`)
      expect(output).to.not.contain('Scope')

      expect(output).to.contain('Client:       a cool client\n')
      expect(output).to.contain('Redirect URI: https://myapp.com\n')

      expect(output).to.not.contain('Token')
      expect(output).to.not.contain('Expires at')
      expect(output).to.not.contain('Updated at')
    })
  })
})
