'use strict'
/* globals describe beforeEach it commands */

const expect = require('chai').expect
const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = commands.find((c) => c.topic === 'stack' && c.command === 'set')

describe('stack:set', function () {
  beforeEach(() => cli.mockConsole())

  it('sets the stack', function () {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp', {build_stack: 'cedar-14'})
      .reply(200, {name: 'myapp', stack: {name: 'cedar-14'}})

    return cmd.run({app: 'myapp', args: {stack: 'cedar-14'}})
      .then(() => expect(cli.stdout).to.equal(`Stack set. Next release on myapp will use cedar-14.
Run git push heroku master to create a new release on myapp.
`))
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => api.done())
  })
})
