import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

const MY_APP = 'myapp'

describe('apps:favorites:add', function () {
  let particleboardApi: nock.Scope

  beforeEach(function () {
    particleboardApi = nock('https://particleboard.heroku.com')
  })

  afterEach(function () {
    particleboardApi.done()
    nock.cleanAll()
  })

  it('adds the app as a favorite', async function () {
    particleboardApi
      .get('/favorites?type=app')
      .reply(200, [])
      .post('/favorites', {resource_id: MY_APP, type: 'app'})
      .reply(201)

    const {stderr, stdout} = await runCommand(['apps:favorites:add', `--app=${MY_APP}`])

    expect(stdout).to.equal('')
    expect(stderr).to.contain(`Adding ⬢ ${MY_APP} to favorites... done`)
  })

  it('errors if app is already favorited', async function () {
    particleboardApi
      .get('/favorites?type=app')
      .reply(200, [{resource_name: MY_APP}])

    const {error} = await runCommand(['apps:favorites:add', `--app=${MY_APP}`])

    expect(error).to.be.an.instanceof(Error)
    expect(error?.message).to.contain('is already a favorite app.')
  })

  it('errors if app not found', async function () {
    particleboardApi
      .get('/favorites?type=app')
      .reply(200, [{resource_name: MY_APP}])
      .post('/favorites', {resource_id: 'NOT_AN_APP', type: 'app'})
      .replyWithError({statusCode: 404})

    const {error} = await runCommand(['apps:favorites:add', '--app=NOT_AN_APP'])

    expect(error).to.be.an.instanceof(Error)
    expect(error?.message).to.contain('App not found')
  })
})
