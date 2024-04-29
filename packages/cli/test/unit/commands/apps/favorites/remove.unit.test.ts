import {expect, test} from '@oclif/test'

const MY_APP = 'myapp'
describe('apps:favorites:remove', function () {
  test
    .stdout()
    .stderr()
    .nock('https://particleboard.heroku.com', api => {
      api.get('/favorites?type=app')
        .reply(200, [{id: 'favoriteid', resource_name: MY_APP}])

      api.delete('/favorites/favoriteid')
        .reply(201)
    })
    .command(['apps:favorites:remove', `--app=${MY_APP}`])
    .it('removes the app as a favorite', ({stdout, stderr}) => {
      expect(stdout).to.equal('')
      expect(stderr).to.contain('Removing ⬢ myapp from favorites... done')
    })

  test
    .stderr()
    .nock('https://particleboard.heroku.com', api => {
      api.get('/favorites?type=app')
        .reply(200, [])
    })
    .command(['apps:favorites:remove', `--app=${MY_APP}`])
    .catch((error: any) => {
      expect(error).to.be.an.instanceof(Error)
      expect(error.message).to.contain('is not already a favorite app.')
    })
    .it('errors if app is not already favorited')
})
