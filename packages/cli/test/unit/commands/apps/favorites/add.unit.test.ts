import {expect, test} from '@oclif/test'

const MY_APP = 'myapp'
describe('apps:favorites:add', function () {
  test
    .stdout()
    .stderr()
    .nock('https://particleboard.heroku.com', api => {
      api.get('/favorites?type=app')
        .reply(200, [])
        .post('/favorites', {type: 'app', resource_id: MY_APP})
        .reply(201)
    })
    .command(['apps:favorites:add', `--app=${MY_APP}`])
    .it('adds the app as a favorite', ({stdout, stderr}) => {
      expect(stdout).to.equal('')
      expect(stderr).to.contain(`Adding ⬢ ${MY_APP} to favorites... done`)
    })

  test
    .stderr()
    .nock('https://particleboard.heroku.com', api => {
      api.get('/favorites?type=app')
        .reply(200, [{resource_name: MY_APP}])
    })
    .command(['apps:favorites:add', `--app=${MY_APP}`])
    .catch((error: any) => {
      expect(error).to.be.an.instanceof(Error)
      expect(error.message).to.contain('is already a favorite app.')
    })
    .it('errors if app is already favorited')

  test
    .stderr()
    .nock('https://particleboard.heroku.com', {}, api => {
      api.get('/favorites?type=app')
        .reply(200, [{resource_name: MY_APP}])
        .post('/favorites', {type: 'app', resource_id: 'NOT_AN_APP'})
        .replyWithError({statusCode: 404})
    })
    .command(['apps:favorites:add', '--app=NOT_AN_APP'])
    .catch((error: any) => {
      expect(error).to.be.an.instanceof(Error)
      expect(error.message).to.contain('App not found')
    })
    .it('errors if app not found')
})
