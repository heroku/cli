import {expect, test} from '@oclif/test'

const testWithAuthorizationsCreate = (requestBody = {}) =>
  test
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .post('/oauth/authorizations', requestBody)
        .reply(201, {scope: ['global'], access_token: {token: 'secrettoken'}})
    })

describe('authorizations:create', () => {
  testWithAuthorizationsCreate({description: 'awesome'})
    .command(['authorizations:create', '--description', 'awesome'])
    .it('creates the authorization', ctx => {
      expect(ctx.stdout).to.contain('Client:      <none>\n')
      expect(ctx.stdout).to.contain('Scope:       global\n')
      expect(ctx.stdout).to.contain('Token:       secrettoken\n')
      if (ctx.error?.message) {
        expect(ctx.error.message).to.contain('Creating OAuth Authorization... done')
      }
    })

  context('with short flag', () => {
    testWithAuthorizationsCreate({expires_in: '10000'})
      .command(['authorizations:create', '--expires-in', '10000', '--short'])
      .it('only prints token', ctx => {
        expect(ctx.stdout).to.equal('secrettoken\n')
      })
  })

  context('with json flag', () => {
    testWithAuthorizationsCreate()
      .command(['authorizations:create', '--json'])
      .it('prints json', ctx => {
        const json = JSON.parse(ctx.stdout)

        expect(json.access_token).to.contain({token: 'secrettoken'})
        expect(json.scope).to.contain('global')
      })
  })

  context('API warning headers', () => {
    test
      .stderr()
      .stdout()
      .nock('https://api.heroku.com:443', api => {
        api
          .post('/oauth/authorizations', {description: 'awesome'})
          .reply(201, {scope: ['global'], access_token: {token: 'secrettoken'}}, {'warning-message': 'this is an API warning message example'})
      })
      .command(['authorizations:create', '--description', 'awesome'])
      .it('outputs API warning message', ctx => {
        expect(ctx.stderr).contains('this is an API warning message example')
      })
  })
})
