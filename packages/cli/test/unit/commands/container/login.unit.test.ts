import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/container/login.js'
import runCommand from '../../../helpers/runCommand.js'
import {expect} from 'chai'
import sinon from 'sinon'
import {DockerHelper} from '../../../../src/lib/container/docker_helper.js'

/*
describe('container:login', function () {
  let sandbox: sinon.SinonSandbox

  beforeEach(function () {
    sandbox = sinon.createSandbox()
    process.env.HEROKU_API_KEY = 'heroku_token'
  })

  afterEach(function () {
    return sandbox.restore()
  })

  it('logs to the docker registry', async function () {
    const version = sandbox.stub(DockerHelper.prototype, 'version').resolves([19, 12])
    const login = sandbox.stub(DockerHelper.prototype, 'cmd')
      .withArgs('docker', ['login', '--username=_', '--password-stdin', 'registry.heroku.com'], {input: 'heroku_token'})

    await runCommand(Cmd)

    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('')
    sandbox.assert.calledOnce(version)
    sandbox.assert.calledOnce(login)
  })

  it('logs to the docker registry with an old version', async function () {
    const version = sandbox.stub(DockerHelper.prototype, 'version').returns(new Promise(function (resolve) {
      resolve([17, 0])
    }))

    const login = sandbox.stub(DockerHelper.prototype, 'cmd')
      .withArgs('docker', ['login', '--username=_', '--password=heroku_token', 'registry.heroku.com'])

    await runCommand(Cmd)

    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('')
    sandbox.assert.calledOnce(version)
    sandbox.assert.calledOnce(login)
  })
})

*/
