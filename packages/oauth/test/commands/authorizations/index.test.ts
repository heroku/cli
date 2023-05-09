import {expect, test} from '@oclif/test'

describe('authorizations', () => {
  const exampleAuthorization1 = {
    description: 'b description',
    id: 'aBcD1234-129f-42d2-854b-dEf123abc123',
    scope: ['global'],
  }
  const exampleAuthorization2 = {
    description: 'awesome',
    id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
    scope: ['app', 'user'],
  }

  const testWithAuthorizations = (auths = [exampleAuthorization1, exampleAuthorization2]) =>
    test
      .stdout()
      .nock('https://api.heroku.com:443', api => {
        api.get('/oauth/authorizations').reply(200, auths)
      })

  testWithAuthorizations()
    .command(['authorizations'])
    .it('lists the authorizations alphabetically by description', ctx => {
      expect(ctx.stdout).to.equal(
        ' awesome       f6e8d969-129f-42d2-854b-c2eca9d5a42e app,user \n' +
        ' b description aBcD1234-129f-42d2-854b-dEf123abc123 global   \n',
      )
    })

  context('with json flag', () => {
    testWithAuthorizations()
      .command(['authorizations', '--json'])
      .it('lists the authorizations alphabetically as json', ctx => {
        const authJSON = JSON.parse(ctx.stdout)

        expect(authJSON[0]).to.eql(exampleAuthorization2)
        expect(authJSON[1]).to.eql(exampleAuthorization1)
      })
  })

  context('without authorizations', () => {
    testWithAuthorizations([])
      .command(['authorizations'])
      .it('shows no authorizations message', ctx => {
        expect(ctx.stdout).to.equal('No OAuth authorizations.\n')
      })
  })
})
