'use strict'
/* globals describe beforeEach it */

const cli = require('heroku-cli-util')
let nock = require('nock')
let expect = require('chai').expect
let apps = require('../../../commands/apps/create.js').apps

describe('apps:create', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('creates an app', function () {
    let mock = nock('https://api.heroku.com')
      .post('/apps', {
      })
      .reply(200, {
        name: 'foobar',
        stack: {name: 'cedar-14'},
        web_url: 'https://foobar.com'
      })

    return apps.run({flags: {}, args: {}, httpGitHost: 'git.heroku.com'}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('Creating app... foobar\n')
      expect(cli.stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    })
  })

  it('creates an app in a space', function () {
    let mock = nock('https://api.heroku.com')
      .post('/organizations/apps', {
        space: 'my-space-name'
      })
      .reply(200, {
        name: 'foobar',
        stack: {name: 'cedar-14'},
        web_url: 'https://foobar.com'
      })

    return apps.run({flags: {space: 'my-space-name'}, args: {}, httpGitHost: 'git.heroku.com'}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('Creating app in space my-space-name... foobar\n')
      expect(cli.stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    })
  })
})
