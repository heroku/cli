import {expect, test} from '@oclif/test'

describe('apps:rename', () => {
  const newApp = {
    name: 'newname',
    web_url: 'https://newname.com',
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
      expect(stderr).to.equal(`Renaming ${oldApp.name} to ${newApp.name}... done Don't forget to update git remotes for all other local checkouts of the app.
`)
    })
})
