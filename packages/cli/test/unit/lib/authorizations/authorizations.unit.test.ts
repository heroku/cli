import * as Heroku from '@heroku-cli/schema'
import {expect, test} from '@oclif/test'
import {formatDistanceToNow, addSeconds} from 'date-fns'
import {display} from '../../../../src/lib/authorizations/authorizations'

const setupDisplay = (auth: Heroku.OAuthAuthorization) =>
  test
    .stdout()
    .do(() => display(auth))

describe('display', function () {
  const authId = 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'
  const authDesc = 'a cool auth'

  context('with an auth', function () {
    const auth: Heroku.OAuthAuthorization = {
      id: authId,
      description: authDesc,
      scope: ['global', 'app'],
    }

    setupDisplay(auth)
      .it('prints the styled authorization', ctx => {
        expect(ctx.stdout).to.contain(`ID:          ${authId}\n`)
        expect(ctx.stdout).to.contain('Scope:       global,app\n')
        expect(ctx.stdout).to.contain(`Description: ${authDesc}\n`)

        expect(ctx.stdout).to.contain('Client:      <none>\n')
        expect(ctx.stdout).to.not.contain('Redirect URI')

        expect(ctx.stdout).to.not.contain('Token')
        expect(ctx.stdout).to.not.contain('Expires at')
        expect(ctx.stdout).to.not.contain('Updated at')
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

    setupDisplay(auth)
      .it('prints the styled authorization with access token info', ctx => {
        const expirationDate = addSeconds(new Date(), 10000)
        expect(ctx.stdout).to.contain(`ID:          ${authId}\n`)
        expect(ctx.stdout).to.contain('Scope:       global,app\n')
        expect(ctx.stdout).to.contain('Description: a cool auth\n')

        expect(ctx.stdout).to.contain('Client:      <none>\n')
        expect(ctx.stdout).to.not.contain('Redirect URI')

        expect(ctx.stdout).to.contain(`ID:          ${authId}\n`)
        expect(ctx.stdout).to.contain(`Updated at:  ${updatedAt}`)
        expect(ctx.stdout).to.contain(`(${formatDistanceToNow(updatedAt)} ago)`)

        expect(ctx.stdout).to.contain(`Expires at:  ${expirationDate}`)
        expect(ctx.stdout).to.contain(`(in ${formatDistanceToNow(expirationDate)})`)
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

    setupDisplay(auth)
      .it('prints the styled authorization with client info', ctx => {
        expect(ctx.stdout).to.contain(`ID:           ${authId}\n`)
        expect(ctx.stdout).to.contain(`Description:  ${authDesc}\n`)
        expect(ctx.stdout).to.not.contain('Scope')

        expect(ctx.stdout).to.contain('Client:       a cool client\n')
        expect(ctx.stdout).to.contain('Redirect URI: https://myapp.com\n')

        expect(ctx.stdout).to.not.contain('Token')
        expect(ctx.stdout).to.not.contain('Expires at')
        expect(ctx.stdout).to.not.contain('Updated at')
      })
  })
})
