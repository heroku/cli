'use strict'
/* globals beforeEach commands */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('chai').expect
const cmd = commands.find(c => c.topic === 'apps' && c.command === 'favorites:add')

describe('apps:favorites:add', () => {
  beforeEach(() => cli.mockConsole())

  it('adds the app as a favorite', () => {
    let api = nock('https://particleboard.heroku.com')
      .get('/favorites?type=app')
      .reply(200, [])
      .post('/favorites', {type: 'app', resource_id: 'myapp'})
      .reply(201)

    return cmd.run({app: 'myapp'})
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal('Adding myapp to favorites... done\n'))
      .then(() => api.done())
  })

  it('errors if app is already favorited', () => {
    nock('https://particleboard.heroku.com')
      .get('/favorites?type=app')
      .reply(200, [{resource_name: 'myapp'}])

    return cmd.run({app: 'myapp'})
      .catch(function (error) {
        expect(error).to.be.an.instanceof(Error)
        expect(error.message).to.equal('myapp is already a favorite app.')
      })
  })
})
