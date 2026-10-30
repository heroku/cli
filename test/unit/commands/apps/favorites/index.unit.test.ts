import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import Favorites from '../../../../../src/commands/apps/favorites/index.js'

describe('apps:favorites', function () {
  let favoriteList: sinon.SinonStub

  beforeEach(function () {
    favoriteList = sinon.stub().resolves([])
    const fakeDashboardBackend = {favorite: {list: favoriteList}}
    sinon.stub(HerokuSDK.prototype, 'dashboardBackend').get(() => fakeDashboardBackend)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('shows all favorite apps in the returned order', async function () {
    favoriteList.resolves([
      {resource_name: 'myotherapp'},
      {resource_name: 'myapp'},
    ])

    const {result, stderr, stdout} = await runCommand(Favorites, [])

    expect(stdout).to.equal('=== Favorited Apps\n\n⬢ myotherapp\n⬢ myapp\n')
    expect(stderr).to.equal('')
    expect(result).to.equal(undefined)
    expect(favoriteList.calledOnceWithExactly({type: 'app'})).to.equal(true)
  })

  it('shows favorite apps as raw JSON', async function () {
    const favorites = [
      {resource_id: 'app-1', resource_name: 'myapp', type: 'app'},
      {resource_id: 'app-2', resource_name: 'myotherapp', type: 'app'},
    ]
    favoriteList.resolves(favorites)

    const {result, stderr, stdout} = await runCommand(Favorites, ['--json'])

    expect(stdout).to.equal(`${JSON.stringify(favorites, null, 2)}\n`)
    expect(stderr).to.equal('')
    expect(result).to.equal(undefined)
    expect(favoriteList.calledOnceWithExactly({type: 'app'})).to.equal(true)
  })

  it('supports the json shorthand flag', async function () {
    favoriteList.resolves([{resource_name: 'myapp'}])

    const {stdout} = await runCommand(Favorites, ['-j'])

    expect(stdout).to.equal('[\n  {\n    "resource_name": "myapp"\n  }\n]\n')
  })

  it('shows the header when there are no favorite apps', async function () {
    const {result, stderr, stdout} = await runCommand(Favorites, [])

    expect(stdout).to.equal('=== Favorited Apps\n\n')
    expect(stderr).to.equal('')
    expect(result).to.equal(undefined)
  })

  it('reports a generic list failure', async function () {
    favoriteList.rejects(new Error('favorite list failed'))

    const {error} = await runCommand(Favorites, [])

    expect(error?.message).to.contain('favorite list failed')
  })

  it('defines the json long and short flags', function () {
    expect(Favorites.flags.json.char).to.equal('j')
  })
})
