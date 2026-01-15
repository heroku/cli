import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('apps:favorites', function () {
  let particleboardApi: nock.Scope
  const MY_APP = 'myapp'
  const MY_APP2 = 'myotherapp'

  beforeEach(function () {
    particleboardApi = nock('https://particleboard.heroku.com')
  })

  afterEach(function () {
    particleboardApi.done()
    nock.cleanAll()
  })

  it('shows all favorite apps', async function () {
    particleboardApi
      .get('/favorites?type=app')
      .reply(200, [{resource_name: MY_APP}, {resource_name: MY_APP2}])

    const {stderr, stdout} = await runCommand(['apps:favorites'])

    expect(stdout).to.contain('=== Favorited Apps\n\n⬢ myapp\n⬢ myotherapp\n')
    expect(stderr).to.equal('')
  })

  it('shows all favorite apps as json', async function () {
    particleboardApi
      .get('/favorites?type=app')
      .reply(200, [{resource_name: MY_APP}, {resource_name: MY_APP2}])

    const {stderr, stdout} = await runCommand(['apps:favorites', '--json'])

    expect(stdout).to.contain('[\n  {\n    "resource_name": "myapp"\n  },\n  {\n    "resource_name": "myotherapp"\n  }\n]\n')
    expect(stderr).to.equal('')
  })
})
