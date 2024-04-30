import {expect, test} from '@oclif/test'

const MY_APP = 'myapp'
const MY_APP2 = 'myotherapp'
describe('apps:favorites', function () {
  test
    .stdout()
    .stderr()
    .nock('https://particleboard.heroku.com', api => {
      api.get('/favorites?type=app')
        .reply(200, [{resource_name: MY_APP}, {resource_name: MY_APP2}])
    })
    .command(['apps:favorites'])
    .it('shows all favorite apps', ({stdout, stderr}) => {
      expect(stdout).to.contain('=== Favorited Apps\n\nmyapp\nmyotherapp\n')
      expect(stderr).to.equal('')
    })

  test
    .stdout()
    .stderr()
    .nock('https://particleboard.heroku.com', api => {
      api.get('/favorites?type=app')
        .reply(200, [{resource_name: MY_APP}, {resource_name: MY_APP2}])
    })
    .command(['apps:favorites', '--json'])
    .it('shows all favorite apps as json', ({stdout, stderr}) => {
      expect(stdout).to.contain('[\n  {\n    "resource_name": "myapp"\n  },\n  {\n    "resource_name": "myotherapp"\n  }\n]\n')
      expect(stderr).to.equal('')
    })
})
