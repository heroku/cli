import {expect, test} from '@oclif/test'

describe('clients:rotate', function () {
  const id = 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'
  const client = {name: 'awesome', id, redirect_uri: 'https://myapp.com', secret: 'supersecretkey'}

  const testWithClientInfo = () =>
    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com:443', api => {
        api
          .post(`/oauth/clients/${id}/actions/rotate-credentials`)
          .reply(200, client)
      })

  testWithClientInfo()
    .command(['clients:rotate', id])
    .it('returns the client info', ctx => {
      expect(ctx.stderr).to.contain('Updating f6e8d969-129f-42d2-854b-c2eca9d5a42e... done\n')
      expect(ctx.stdout).to.contain('=== awesome\n')
      expect(ctx.stdout).to.contain('id:           f6e8d969-129f-42d2-854b-c2eca9d5a42e\n')
      expect(ctx.stdout).to.contain('name:         awesome\n')
      expect(ctx.stdout).to.contain('redirect_uri: https://myapp.com\n')
      expect(ctx.stdout).to.contain('secret:       supersecretkey\n')
    })

  context('with json flag', function () {
    testWithClientInfo()
      .command(['clients:rotate', id, '--json'])
      .it('returns the client info as json', ctx => {
        expect(ctx.stderr).to.contain('Updating f6e8d969-129f-42d2-854b-c2eca9d5a42e... done\n')
        expect(JSON.parse(ctx.stdout)).to.contain(client)
      })
  })

  context('with shell flag', function () {
    testWithClientInfo()
      .command(['clients:rotate', id, '--shell'])
      .it('returns the client info as shell', ctx => {
        expect(ctx.stderr).to.contain('Updating f6e8d969-129f-42d2-854b-c2eca9d5a42e... done\n')
        expect(ctx.stdout).to.equal(
          'HEROKU_OAUTH_ID=f6e8d969-129f-42d2-854b-c2eca9d5a42e\nHEROKU_OAUTH_SECRET=supersecretkey\n',
        )
      })
  })
})
