import {expect, test} from '@oclif/test'

describe('clients:create', () => {
  const createResponse = {
    name: 'awesome',
    id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
    redirect_uri: 'https://myapp.com',
    secret: 'clientsecret',
  }

  const testWithClientCreate = () => test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com:443', api => {
      api.post('/oauth/clients', {
        name: 'awesome',
        redirect_uri: 'https://myapp.com',
      }).reply(201, createResponse)
    })

  testWithClientCreate()
    .command(['clients:create', 'awesome', 'https://myapp.com'])
    .it('creates the client and outputs id and secret', ctx => {
      expect(ctx.stdout).to.equal(
        'HEROKU_OAUTH_ID=f6e8d969-129f-42d2-854b-c2eca9d5a42e\nHEROKU_OAUTH_SECRET=clientsecret\n',
      )
    // TODO: Not currently testable due to a cli-ux mocking issue
    // expect(ctx.stderr).to.contain('Creating awesome... done\n')
    })

  testWithClientCreate()
    .command(['clients:create', 'awesome', 'https://myapp.com', '--json'])
    .it('creates the client and outputs json', ctx => {
      expect(JSON.parse(ctx.stdout)).to.contain(createResponse)
      expect(ctx.stderr).to.contain('Creating awesome... done\n')
    })
})
