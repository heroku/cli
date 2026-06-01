import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Remove from '../../../../../src/commands/apps/favorites/remove.js'

const MY_APP = 'myapp'

describe('apps:favorites:remove', function () {
  let particleboardApi: nock.Scope

  beforeEach(function () {
    particleboardApi = nock('https://particleboard.heroku.com')
  })

  afterEach(function () {
    particleboardApi.done()
    nock.cleanAll()
  })

  it('removes the app as a favorite', async function () {
    particleboardApi
      .get('/favorites?type=app')
      .reply(200, [{id: 'favoriteid', resource_name: MY_APP}])
      .delete('/favorites/favoriteid')
      .reply(201)

    const {stderr, stdout} = await runCommand(Remove, [`--app=${MY_APP}`])

    expect(stdout).to.equal('')
    expect(stderr).to.contain('Removing ⬢ myapp from favorites... done')
  })

  it('errors if app is not already favorited', async function () {
    particleboardApi
      .get('/favorites?type=app')
      .reply(200, [])

    const {error} = await runCommand(Remove, [`--app=${MY_APP}`])

    expect(error).to.be.an.instanceof(Error)
    expect(error?.message).to.contain('is not already a favorite app.')
  })
})
