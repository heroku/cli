import {expect, test} from '@oclif/test'

describe('clients:info', () => {
  const id = 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'
  const client = {name: 'awesome', id, redirect_uri: 'https://myapp.com', secret: 'supersecretkey'}

  const testWithClientInfo = () =>
    test
      .stdout()
      .nock('https://api.heroku.com:443', api => {
        api
          .get('/oauth/clients/f6e8d969-129f-42d2-854b-c2eca9d5a42e')
          .reply(200, client)
      })

  testWithClientInfo()
    .command(['clients:info', id])
    .it('gets the client info', ctx => {
      expect(ctx.stdout).to.contain('=== awesome\n')
      expect(ctx.stdout).to.contain('id:           f6e8d969-129f-42d2-854b-c2eca9d5a42e\n')
      expect(ctx.stdout).to.contain('name:         awesome\n')
      expect(ctx.stdout).to.contain('redirect_uri: https://myapp.com\n')
      expect(ctx.stdout).to.contain('secret:       supersecretkey\n')
    })

  context('with json flag', () => {
    testWithClientInfo()
      .command(['clients:info', id, '--json'])
      .it('gets the client info as json', ctx => {
        expect(JSON.parse(ctx.stdout)).to.contain(client)
      })
  })

  context('with shell flag', () => {
    testWithClientInfo()
      .command(['clients:info', id, '--shell'])
      .it('gets the client info as shell', ctx => {
        expect(ctx.stdout).to.equal(
          'HEROKU_OAUTH_ID=f6e8d969-129f-42d2-854b-c2eca9d5a42e\nHEROKU_OAUTH_SECRET=supersecretkey\n',
        )
      })
  })
})
