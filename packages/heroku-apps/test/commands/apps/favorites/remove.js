'use strict'
/* globals describe beforeEach it commands */

const nock = require('nock')
const cli = require('heroku-cli-util')
const expect = require('chai').expect
const cmd = commands.find((c) => c.topic === 'apps' && c.command === 'favorites:remove')

describe('apps:favorites:remove', () => {
  beforeEach(() => cli.mockConsole())

  it('removes the app as a favorite', () => {
    let api = nock('https://longboard.heroku.com:443')
      .get('/favorites')
      .reply(200, [{app_name: 'myapp'}])
      .delete('/favorites/myapp')
      .reply(201)

    return cmd.run({app: 'myapp'})
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal('Removing myapp from favorites... done\n'))
      .then(() => api.done())
  })
})
