import {expect} from 'chai'
import {runCommand} from '@oclif/test'
import nock from 'nock'

const MY_APP = 'myapp'

describe('apps:favorites:remove', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('removes the app as a favorite', async function () {
    nock('https://particleboard.heroku.com')
      .get('/favorites?type=app')
      .reply(200, [{id: 'favoriteid', resource_name: MY_APP}])
      .delete('/favorites/favoriteid')
      .reply(201)

    const {stdout, stderr} = await runCommand(['apps:favorites:remove', `--app=${MY_APP}`])

    expect(stdout).to.equal('')
    expect(stderr).to.contain('Removing ⬢ myapp from favorites... done')
  })

  it('errors if app is not already favorited', async function () {
    nock('https://particleboard.heroku.com')
      .get('/favorites?type=app')
      .reply(200, [])

    const {error} = await runCommand(['apps:favorites:remove', `--app=${MY_APP}`])

    expect(error).to.be.an.instanceof(Error)
    expect(error?.message).to.contain('is not already a favorite app.')
  })
})
