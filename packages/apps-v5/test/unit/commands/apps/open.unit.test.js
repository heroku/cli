'use strict'
/* globals beforeEach */

const cli = require('@heroku/heroku-cli-util')
const expect = require('chai').expect
const nock = require('nock')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

let cmd
let openStub

let app = {
  web_url: 'https://myapp.herokuapp.com',
}

describe('heroku apps:open', function () {
  beforeEach(async () => {
    openStub = sinon.stub(cli, 'open')

    cmd = proxyquire('../../../../src/commands/apps/open', {
      '@heroku/heroku-cli-util': openStub,
    })
    cli.mockConsole()
  })

  this.afterEach(() => {
    openStub.restore()
  })

  it('opens specified app', function () {
    nock('https://api.heroku.com').get('/apps/myapp').reply(200, app)

    return cmd[0].run({app: 'myapp', args: {}})
      .then(() => expect(openStub.called).to.be.true)
  })
})
