import {expect, test} from '@oclif/test'

describe('clients:update', function () {
  context('with a name flag', function () {
    test
      .stderr()
      .nock('https://api.heroku.com', api => {
        api.patch('/oauth/clients/f6e8d969-129f-42d2-854b-c2eca9d5a42e', {name: 'newname'})
          .reply(200, {
            name: 'newname',
            id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
            redirect_uri: 'https://myapp.com',
            secret: 'clientsecret',
          })
      })
      .command(['clients:update', 'f6e8d969-129f-42d2-854b-c2eca9d5a42e', '--name', 'newname'])
      .it('updates the client name', ctx => {
        expect(ctx.stderr).to.contain('Updating f6e8d969-129f-42d2-854b-c2eca9d5a42e... done\n')
      })
  })

  context('with a url flag', function () {
    test
      .stderr()
      .nock('https://api.heroku.com', api => {
        api.patch('/oauth/clients/f6e8d969-129f-42d2-854b-c2eca9d5a42e', {redirect_uri: 'https://heroku.com'})
          .reply(200, {
            name: 'newname',
            id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
            redirect_uri: 'https://heroku.com',
            secret: 'clientsecret',
          })
      })
      .command(['clients:update', 'f6e8d969-129f-42d2-854b-c2eca9d5a42e', '--url', 'https://heroku.com'])
      .it('updates the client url', ctx => {
        expect(ctx.stderr).to.contain('Updating f6e8d969-129f-42d2-854b-c2eca9d5a42e... done\n')
      })
  })

  context('with no flags', function () {
    test
      .stdout()
      .command(['clients:update', 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'])
      .catch(error => expect(error.message).to.equal(
        'No changes provided.',
      ))
      .it('errors with no changes provided')
  })
})
