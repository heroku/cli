'use strict'
/* global describe it */

let sinon = require('sinon')
let nock = require('nock')
const { expect } = require('chai')
let proxyquire = require('proxyquire')

describe('git:clone', function () {
  it('errors if no app given', function () {
    let clone = require('../..').commands.find((c) => c.topic === 'git' && c.command === 'clone')

    return expect(clone.run({ flags: {}, args: [] }))
      .to.be.rejectedWith(Error, 'Specify an app with --app')
  })

  it('clones the repo', function () {
    let git = require('../mock/git')
    let mock = sinon.mock(git)
    mock.expects('spawn').withExactArgs(['clone', '-o', 'heroku', 'https://git.heroku.com/myapp.git', 'myapp']).returns(Promise.resolve()).once()
    let clone = proxyquire('../../commands/git/clone', { '../../lib/git': () => git })
    let api = nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, { name: 'myapp' })

    return clone.run({ flags: { app: 'myapp' }, args: [] })
      .then(() => {
        mock.verify()
        mock.restore()
        api.done()
      })
  })
})
