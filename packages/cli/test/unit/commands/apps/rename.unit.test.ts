import {expect} from 'chai'
import {runCommand} from '@oclif/test'
import nock from 'nock'
import {unwrap} from '../../../helpers/utils/unwrap.js'

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

  afterEach(function () {
    nock.cleanAll()
  })

  it('renames an app', async function () {
    nock('https://api.heroku.com')
      .patch(`/apps/${oldApp.name}`, {name: newApp.name})
      .reply(200, newApp)

    const {stdout, stderr} = await runCommand(['apps:rename', '-a', oldApp.name, newApp.name])

    expect(stdout).to.equal('https://newname.com | https://git.heroku.com/newname.git\n')
    expect(unwrap(stderr)).to.contains('Renaming myapp to newname... doneWarning: Don\'t forget to update git remotes for all other local checkouts of the app.\n')
  })

  it('gives a message if the web_url is still http', async function () {
    nock('https://api.heroku.com')
      .patch(`/apps/${oldApp.name}`, {name: newApp.name})
      .reply(200, newAppSillUsingHttp)

    const {stdout, stderr} = await runCommand(['apps:rename', '-a', oldApp.name, newApp.name])

    expect(stdout).to.equal('http://newname.com | https://git.heroku.com/newname.git\nPlease note that it may take a few minutes for Heroku to provision a SSL certificate for your application.\n')
    expect(unwrap(stderr)).to.contains('Renaming myapp to newname... doneWarning: Don\'t forget to update git remotes for all other local checkouts of the app.\n')
  })
})
