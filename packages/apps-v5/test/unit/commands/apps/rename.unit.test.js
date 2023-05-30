'use strict'
/* globals beforeEach commands */

const cli = require('heroku-cli-util')
const expect = require('chai').expect
const nock = require('nock')
const unwrap = require('../../unwrap.js')
const cmd = commands.find(c => c.topic === 'apps' && c.command === 'rename')

describe('heroku apps:rename', function () {
  beforeEach(() => cli.mockConsole())

  it('renames an app', function () {
    let api = nock('https://api.heroku.com')
      .patch('/apps/myapp', {name: 'newname'})
      .reply(200, {
        name: 'foobar',
        web_url: 'https://foobar.com',
      })

    return cmd.run({app: 'myapp', flags: {}, args: {newname: 'newname'}, httpGitHost: 'git.heroku.com'})
      .then(() => expect(unwrap(cli.stderr)).to.equal(`Renaming myapp to newname... done Don't forget to update git remotes for all other local checkouts of the app.
`))
      .then(() => expect(cli.stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n'))
      .then(() => api.done())
  })

  it('gives a message if the web_url is still http', function () {
    let api = nock('https://api.heroku.com')
      .patch('/apps/myapp', {name: 'newname'})
      .reply(200, {
        name: 'foobar',
        web_url: 'http://foobar.com',
      })

    return cmd.run({app: 'myapp', flags: {}, args: {newname: 'newname'}, httpGitHost: 'git.heroku.com'})
    // eslint-disable-next-line no-useless-escape
      .then(() => expect(unwrap(cli.stderr)).to.contain(`Renaming myapp to newname... done Don\'t forget to update git remotes for all other local checkouts of the app.
`))
      .then(() => expect(cli.stdout).to.equal('http://foobar.com | https://git.heroku.com/foobar.git\nPlease note that it may take a few minutes for Heroku to provision a SSL certificate for your application.\n'))
      .then(() => api.done())
  })
})
