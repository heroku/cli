import {stdout, stderr} from 'stdout-stderr'
import Cmd  from 'REPLACE_WITH_PATH_TO_COMMAND'
import runCommand from '../../../helpers/runCommand'
let cli = require('heroku-cli-util')
let proxyquire = require('proxyquire')
const sinon = require('sinon')
let openStub = sinon.stub(cli, 'open')
  .callsFake(() => {})
let cmd = commands.find(c => c.topic === 'addons' && c.command === 'docs')
let docs
describe('addons:docs', function () {
  beforeEach(() => cli.mockConsole())
  it('opens an addon by name', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/addon-services/slowdb')
      .reply(200, {name: 'slowdb'})
    return runCommand(Cmd, [
      '--show-url',
      'slowdb',
    ])
      .then(() => expect(stdout.output).to.equal('https://devcenter.heroku.com/articles/slowdb\n'))
      .then(() => expect(stderr.output).to.equal(''))
      .then(() => api.done())
  })
  it('opens an addon by name with no url flag passed', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/addon-services/slowdb')
      .reply(200, {name: 'slowdb'})
    docs = proxyquire('../../../../commands/addons/docs', {
      'heroku-cli-util': openStub,
    })
    return runCommand(Cmd, [
      'slowdb',
    ])
      .then(() => expect(stdout.output).to.equal('Opening https://devcenter.heroku.com/articles/slowdb...\n'))
      .then(() => api.done())
  })
  it('opens an addon by attachment name', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/addon-services/my-attachment-1111')
      .reply(404)
      .post('/actions/addons/resolve', {addon: 'my-attachment-1111'})
      .reply(200, [{addon_service: {name: 'slowdb'}}])
    return runCommand(Cmd, [
      '--show-url',
      'my-attachment-1111',
    ])
      .then(() => expect(stdout.output).to.equal('https://devcenter.heroku.com/articles/slowdb\n'))
      .then(() => expect(stderr.output).to.equal(''))
      .then(() => api.done())
  })
  it('opens an addon by app/attachment name', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/addon-services/my-attachment-1111')
      .reply(404)
      .post('/actions/addons/resolve', {app: 'myapp', addon: 'my-attachment-1111'})
      .reply(200, [{addon_service: {name: 'slowdb'}}])
    return runCommand(Cmd, [
      '--app',
      'myapp',
      '--show-url',
      'my-attachment-1111',
    ])
      .then(() => expect(stdout.output).to.equal('https://devcenter.heroku.com/articles/slowdb\n'))
      .then(() => expect(stderr.output).to.equal(''))
      .then(() => api.done())
  })
})
