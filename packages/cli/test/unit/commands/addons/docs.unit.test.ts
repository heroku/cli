import {stdout, stderr} from 'stdout-stderr'
import runCommand from '../../../helpers/runCommand'
import * as proxyquire from 'proxyquire'
import * as nock from 'nock'
import * as sinon from 'sinon'
import {expect} from 'chai'

const {default: Cmd} =  proxyquire(
  '../../../../src/commands/addons/docs',
  {open: sinon.stub()},
)

describe('addons:docs', function () {
  it('opens an addon by name', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/addon-services/slowdb')
      .reply(200, {name: 'slowdb'})

    await runCommand(Cmd, ['--show-url', 'slowdb'])

    expect(stdout.output).to.equal('https://devcenter.heroku.com/articles/slowdb\n')
    expect(stderr.output).to.equal('')
    api.done()
  })

  it('opens an addon by name with no url flag passed', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/addon-services/slowdb')
      .reply(200, {name: 'slowdb'})

    await runCommand(Cmd, ['slowdb'])

    expect(stdout.output).to.equal('Opening https://devcenter.heroku.com/articles/slowdb...\n')
    api.done()
  })

  it('opens an addon by attachment name', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/addon-services/my-attachment-1111')
      .reply(404)
      .post('/actions/addons/resolve', {addon: 'my-attachment-1111', app: null})
      .reply(200, [{addon_service: {name: 'slowdb'}}])

    await runCommand(Cmd, ['--show-url', 'my-attachment-1111'])

    expect(stdout.output).to.equal('https://devcenter.heroku.com/articles/slowdb\n')
    expect(stderr.output).to.equal('')
    api.done()
  })

  it('opens an addon by app/attachment name', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/addon-services/my-attachment-1111')
      .reply(404)
      .post('/actions/addons/resolve', {app: 'myapp', addon: 'my-attachment-1111'})
      .reply(200, [{addon_service: {name: 'slowdb'}}])

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--show-url',
      'my-attachment-1111',
    ])

    expect(stdout.output).to.equal('https://devcenter.heroku.com/articles/slowdb\n')
    expect(stderr.output).to.equal('')
    api.done()
  })
})
