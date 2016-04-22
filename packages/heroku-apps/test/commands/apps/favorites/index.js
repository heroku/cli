'use strict'
/* globals describe beforeEach afterEach it commands */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('chai').expect
let cmd = commands.find((c) => c.topic === 'apps' && c.command === 'favorites')

describe('apps:favorites:remove', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('shows all favorite apps', () => {
    let api = nock('https://longboard.heroku.com:443')
      .get('/favorites')
      .reply(200, [{app_name: 'myapp'}, {app_name: 'myotherapp'}])

    return cmd.run({app: 'myapp', flags: {json: false}})
      .then(() => expect(cli.stdout).to.equal(`=== Favorited Apps
myapp
myotherapp
`))
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => api.done())
  })

  it('shows all favorite apps as json', () => {
    let api = nock('https://longboard.heroku.com:443')
      .get('/favorites')
      .reply(200, [{app_name: 'myapp'}, {app_name: 'myotherapp'}])

    return cmd.run({app: 'myapp', flags: {json: true}})
      .then(() => expect(JSON.parse(cli.stdout)[0].app_name).to.equal('myapp'))
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => api.done())
  })
})
