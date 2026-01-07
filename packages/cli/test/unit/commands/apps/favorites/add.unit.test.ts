import {expect} from 'chai'
import {runCommand} from '@oclif/test'
import nock from 'nock'

const MY_APP = 'myapp'

describe('apps:favorites:add', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('adds the app as a favorite', async function () {
    nock('https://particleboard.heroku.com')
      .get('/favorites?type=app')
      .reply(200, [])
      .post('/favorites', {type: 'app', resource_id: MY_APP})
      .reply(201)

    const {stdout, stderr} = await runCommand(['apps:favorites:add', `--app=${MY_APP}`])

    expect(stdout).to.equal('')
    expect(stderr).to.contain(`Adding ${MY_APP} to favorites... done`)
  })

  it('errors if app is already favorited', async function () {
    nock('https://particleboard.heroku.com')
      .get('/favorites?type=app')
      .reply(200, [{resource_name: MY_APP}])

    const {error} = await runCommand(['apps:favorites:add', `--app=${MY_APP}`])

    expect(error).to.be.an.instanceof(Error)
    expect(error?.message).to.contain('is already a favorite app.')
  })

  it('errors if app not found', async function () {
    nock('https://particleboard.heroku.com')
      .get('/favorites?type=app')
      .reply(200, [{resource_name: MY_APP}])
      .post('/favorites', {type: 'app', resource_id: 'NOT_AN_APP'})
      .replyWithError({statusCode: 404})

    const {error} = await runCommand(['apps:favorites:add', '--app=NOT_AN_APP'])

    expect(error).to.be.an.instanceof(Error)
    expect(error?.message).to.contain('App not found')
  })
})
