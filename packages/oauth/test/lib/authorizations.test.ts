import * as Heroku from '@heroku-cli/schema'
import {expect, test} from '@oclif/test'
import * as addSeconds from 'date-fns/add_seconds'
import * as distanceInWordsToNow from 'date-fns/distance_in_words_to_now'

import {display} from '../../src/lib/authorizations'

const setupDisplay = (auth: Heroku.OAuthAuthorization) =>
  test
    .stdout()
    .do(() => display(auth))

describe('display', () => {
  context('with an auth', () => {
    const auth: Heroku.OAuthAuthorization = {
      id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
      description: 'a cool auth',
      scope: ['global', 'app']
    }

    setupDisplay(auth)
      .it('prints the styled authorization', ctx => {
        expect(ctx.stdout).to.contain('ID:          f6e8d969-129f-42d2-854b-c2eca9d5a42e\n')
        expect(ctx.stdout).to.contain('Scope:       global,app\n')
        expect(ctx.stdout).to.contain('Description: a cool auth\n')

        expect(ctx.stdout).to.contain('Client:      <none>\n')
        expect(ctx.stdout).to.not.contain('Redirect URI')

        expect(ctx.stdout).to.not.contain('Token')
        expect(ctx.stdout).to.not.contain('Expires at')
        expect(ctx.stdout).to.not.contain('Updated at')
      })
  })

  context('with an auth access token', () => {
    const auth: Heroku.OAuthAuthorization = {
      id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
      description: 'a cool auth',
      scope: ['global', 'app'],
      updated_at: `${new Date(0)}`,
      access_token: {
        token: '1234abcd-129f-42d2-854b-EfGhIjKlMn12',
        expires_in: 10000
      }
    }

    setupDisplay(auth)
      .it('prints the styled authorization with access token info', ctx => {
        expect(ctx.stdout).to.contain('ID:          f6e8d969-129f-42d2-854b-c2eca9d5a42e\n')
        expect(ctx.stdout).to.contain('Scope:       global,app\n')
        expect(ctx.stdout).to.contain('Description: a cool auth\n')

        expect(ctx.stdout).to.contain('Client:      <none>\n')
        expect(ctx.stdout).to.not.contain('Redirect URI')

        expect(ctx.stdout).to.contain('Token:       1234abcd-129f-42d2-854b-EfGhIjKlMn12\n')
        expect(ctx.stdout).to.contain(`Updated at:  ${new Date(0)}`)
        expect(ctx.stdout).to.contain(`(${distanceInWordsToNow(new Date(0))} ago)`)

        const expirationDate = addSeconds(new Date(), 10000)
        expect(ctx.stdout).to.contain(`Expires at:  ${expirationDate}`)
        expect(ctx.stdout).to.contain(`(in ${distanceInWordsToNow(expirationDate)})`)
      })
  })

  context('with a client', () => {
    let client: Heroku.OAuthClient = {
      redirect_uri: 'https://myapp.com',
      name: 'a cool client'
    }

    const auth: Heroku.OAuthAuthorization = {
      id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
      description: 'a cool auth',
      client
    }

    setupDisplay(auth)
      .it('prints the styled authorization with client info', ctx => {
        expect(ctx.stdout).to.contain('ID:           f6e8d969-129f-42d2-854b-c2eca9d5a42e\n')
        expect(ctx.stdout).to.contain('Description:  a cool auth\n')
        expect(ctx.stdout).to.not.contain('Scope')

        expect(ctx.stdout).to.contain('Client:       a cool client\n')
        expect(ctx.stdout).to.contain('Redirect URI: https://myapp.com\n')

        expect(ctx.stdout).to.not.contain('Token')
        expect(ctx.stdout).to.not.contain('Expires at')
        expect(ctx.stdout).to.not.contain('Updated at')
      })
  })
})
