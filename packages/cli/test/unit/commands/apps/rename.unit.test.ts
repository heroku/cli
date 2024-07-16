import {expect, test} from '@oclif/test'
import {unwrap} from '../../../helpers/utils/unwrap'

describe('apps:rename', function () {
  const newApp = {
    name: 'newname',
    web_url: 'https://newname.com',
  }
  const newAppSillUsingHttp = {
    name: 'newname',
    web_url: 'http://newname.com',
  }
  const oldApp = {
    name: 'myapp',
  }

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api =>
      api
        .patch(`/apps/${oldApp.name}`, {name: newApp.name})
        .reply(200, newApp),
    )
    .command(['apps:rename', '-a', oldApp.name, newApp.name])
    .it('renames an app', ({stdout, stderr}) => {
      expect(stdout).to.equal('https://newname.com | https://git.heroku.com/newname.git\n')
      expect(unwrap(stderr)).to.contains('Renaming myapp to newname... doneWarning: Don\'t forget to update git remotes for all other local checkouts of the app.\n')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api =>
      api
        .patch(`/apps/${oldApp.name}`, {name: newApp.name})
        .reply(200, newAppSillUsingHttp),
    )
    .command(['apps:rename', '-a', oldApp.name, newApp.name])
    .it('gives a message if the web_url is still http', ({stdout, stderr}) => {
      expect(stdout).to.equal('http://newname.com | https://git.heroku.com/newname.git\nPlease note that it may take a few minutes for Heroku to provision a SSL certificate for your application.\n')
      expect(unwrap(stderr)).to.contains('Renaming myapp to newname... doneWarning: Don\'t forget to update git remotes for all other local checkouts of the app.\n')
    })
})
