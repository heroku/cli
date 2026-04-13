import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'

import Cmd from '../../../../src/commands/addons/docs.js'

describe('addons:docs', function () {
  let urlOpenerStub: sinon.SinonStub

  beforeEach(function () {
    urlOpenerStub = sinon.stub(Cmd, 'urlOpener').callsFake(async () => {})
  })

  afterEach(function () {
    urlOpenerStub.reset()
    urlOpenerStub.restore()
    nock.cleanAll()
  })

  it('opens an addon by name', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/addon-services/slowdb')
      .reply(200, {name: 'slowdb'})

    const {stderr, stdout} = await runCommand(Cmd, ['--show-url', 'slowdb'])
    expect(stdout).to.equal('https://devcenter.heroku.com/articles/slowdb\n')
    expect(stderr).to.equal('')
    api.done()
  })

  it('opens an addon by name with no url flag passed', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/addon-services/slowdb')
      .reply(200, {name: 'slowdb'})

    const {stdout} = await runCommand(Cmd, ['slowdb'])
    expect(stdout).to.equal('Opening https://devcenter.heroku.com/articles/slowdb...\n')
    expect(urlOpenerStub.calledWith('https://devcenter.heroku.com/articles/slowdb')).to.be.true
    api.done()
  })

  it('opens an addon by attachment name', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/addon-services/my-attachment-1111')
      .reply(404)
      .post('/actions/addons/resolve', {addon: 'my-attachment-1111', app: null})
      .reply(200, [{addon_service: {name: 'slowdb'}}])

    const {stderr, stdout} = await runCommand(Cmd, ['--show-url', 'my-attachment-1111'])
    expect(stdout).to.equal('https://devcenter.heroku.com/articles/slowdb\n')
    expect(stderr).to.equal('')
    api.done()
  })

  it('opens an addon by app/attachment name', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/addon-services/my-attachment-1111')
      .reply(404)
      .post('/actions/addons/resolve', {addon: 'my-attachment-1111', app: 'myapp'})
      .reply(200, [{addon_service: {name: 'slowdb'}}])

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--show-url',
      'my-attachment-1111',
    ])
    expect(stdout).to.equal('https://devcenter.heroku.com/articles/slowdb\n')
    expect(stderr).to.equal('')
    api.done()
  })
})
