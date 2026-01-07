import {expect} from 'chai'
import {runCommand} from '@oclif/test'
import nock from 'nock'

const MY_APP = 'myapp'
const MY_APP2 = 'myotherapp'

describe('apps:favorites', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('shows all favorite apps', async function () {
    nock('https://particleboard.heroku.com')
      .get('/favorites?type=app')
      .reply(200, [{resource_name: MY_APP}, {resource_name: MY_APP2}])

    const {stdout, stderr} = await runCommand(['apps:favorites'])

    expect(stdout).to.contain('=== Favorited Apps\n\nmyapp\nmyotherapp\n')
    expect(stderr).to.equal('')
  })

  it('shows all favorite apps as json', async function () {
    nock('https://particleboard.heroku.com')
      .get('/favorites?type=app')
      .reply(200, [{resource_name: MY_APP}, {resource_name: MY_APP2}])

    const {stdout, stderr} = await runCommand(['apps:favorites', '--json'])

    expect(stdout).to.contain('[\n  {\n    "resource_name": "myapp"\n  },\n  {\n    "resource_name": "myotherapp"\n  }\n]\n')
    expect(stderr).to.equal('')
  })
})
