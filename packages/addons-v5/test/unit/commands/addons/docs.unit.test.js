'use strict'
/* globals beforeEach commands expect nock */

let cli = require('@heroku/heroku-cli-util')
let proxyquire = require('proxyquire')
const sinon = require('sinon')
let openStub = sinon.stub(cli, 'open').callsFake(() => {})
let cmd = commands.find(c => c.topic === 'addons' && c.command === 'docs')
let docs

describe('addons:docs', function () {
  beforeEach(() => cli.mockConsole())

  it('opens an addon by name', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/addon-services/slowdb')
      .reply(200, {name: 'slowdb'})

    return cmd.run({args: {addon: 'slowdb'}, flags: {'show-url': true}})
      .then(() => expect(cli.stdout).to.equal('https://devcenter.heroku.com/articles/slowdb\n'))
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => api.done())
  })

  it('opens an addon by name with no url flag passed', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/addon-services/slowdb')
      .reply(200, {name: 'slowdb'})

    docs = proxyquire('../../../../commands/addons/docs', {
      '@heroku/heroku-cli-util': openStub,
    })

    return docs.run({args: {addon: 'slowdb'}, flags: {}})
      .then(() => expect(cli.stdout).to.equal('Opening https://devcenter.heroku.com/articles/slowdb...\n'))
      .then(() => api.done())
  })

  it('opens an addon by attachment name', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/addon-services/my-attachment-1111')
      .reply(404)
      .post('/actions/addons/resolve', {addon: 'my-attachment-1111'})
      .reply(200, [{addon_service: {name: 'slowdb'}}])

    return cmd.run({args: {addon: 'my-attachment-1111'}, flags: {'show-url': true}})
      .then(() => expect(cli.stdout).to.equal('https://devcenter.heroku.com/articles/slowdb\n'))
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => api.done())
  })

  it('opens an addon by app/attachment name', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/addon-services/my-attachment-1111')
      .reply(404)
      .post('/actions/addons/resolve', {app: 'myapp', addon: 'my-attachment-1111'})
      .reply(200, [{addon_service: {name: 'slowdb'}}])

    return cmd.run({app: 'myapp', args: {addon: 'my-attachment-1111'}, flags: {'show-url': true}})
      .then(() => expect(cli.stdout).to.equal('https://devcenter.heroku.com/articles/slowdb\n'))
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => api.done())
  })
})
