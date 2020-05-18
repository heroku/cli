'use strict'
/* global describe it */

const sinon = require('sinon')
const nock = require('nock')
const expect = require('unexpected')
const proxyquire = require('proxyquire')

describe('git:clone', function () {
  it('errors if no app given', function () {
    const clone = require('../..').commands.find(c => c.topic === 'git' && c.command === 'clone')

    return expect(clone.run({flags: {}, args: []}),
      'to be rejected with', {message: 'Specify an app with --app'})
  })

  it('clones the repo', function () {
    const git = require('../mock/git')
    const mock = sinon.mock(git)
    mock.expects('spawn').withExactArgs(['clone', '-o', 'heroku', 'https://git.heroku.com/myapp.git', 'myapp']).returns(Promise.resolve()).once()
    const clone = proxyquire('../../commands/git/clone', {'../../lib/git': () => git})
    const api = nock('https://api.heroku.com')
    .get('/apps/myapp')
    .reply(200, {name: 'myapp'})

    return clone.run({flags: {app: 'myapp'}, args: []})
    .then(() => {
      mock.verify()
      mock.restore()
      api.done()
    })
  })
})
