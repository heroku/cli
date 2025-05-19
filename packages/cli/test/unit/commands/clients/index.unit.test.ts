import {expect, test} from '@oclif/test'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

/*
describe('clients', function () {
  describe('with clients', function () {
    const exampleClient1 = {
      name: 'awesome',
      id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
      redirect_uri: 'https://myapp.com',
    }
    const testWithClients = () =>
      test
        .stdout()
        .nock('https://api.heroku.com:443', api => {
          api.get('/oauth/clients').reply(200, [exampleClient1])
        })

    testWithClients()
      .command(['clients'])
      .it('lists the clients', ctx => {
        const actual = removeAllWhitespace(ctx.stdout)
        const expected = removeAllWhitespace('awesome f6e8d969-129f-42d2-854b-c2eca9d5a42e https://myapp.com')
        expect(actual).to.include(expected)
      })

    testWithClients()
      .command(['clients', '--json'])
      .it('lists the clients as json', ctx => {
        expect(JSON.parse(ctx.stdout)[0]).to.contain(exampleClient1)
      })
  })

  describe('without clients', function () {
    test
      .nock('https://api.heroku.com:443', api => {
        api.get('/oauth/clients').reply(200, [])
      })
      .stdout()
      .command(['clients'])
      .it('shows no clients message', ctx => {
        expect(ctx.stdout).to.equal('No OAuth clients.\n')
      })
  })
})

*/
