import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/container/login'
import runCommand from '../../../helpers/runCommand'
import {expect} from 'chai'
import * as sinon from 'sinon'
import * as DockerHelper from '../../../../src/lib/container/docker_helper'

const sandbox = sinon.createSandbox()

describe('container:login', () => {
  beforeEach(() => {
    process.env.HEROKU_API_KEY = 'heroku_token'
  })
  afterEach(() => sandbox.restore())

  it('logs to the docker registry', async function () {
    const version = sandbox.stub(DockerHelper, 'version').returns(new Promise(function (resolve, _) {
      resolve([19, 12])
    }))

    const login = sandbox.stub(DockerHelper, 'cmd')
      .withArgs('docker', ['login', '--username=_', '--password-stdin', 'registry.heroku.com'], {input: 'heroku_token'})

    await runCommand(Cmd)

    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('')
    sandbox.assert.calledOnce(version)
    sandbox.assert.calledOnce(login)
  })

  it('logs to the docker registry with an old version', async function () {
    const version = sandbox.stub(DockerHelper, 'version').returns(new Promise(function (resolve, _) {
      resolve([17, 0])
    }))

    const login = sandbox.stub(DockerHelper, 'cmd')
      .withArgs('docker', ['login', '--username=_', '--password=heroku_token', 'registry.heroku.com'])

    await runCommand(Cmd)

    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('')
    sandbox.assert.calledOnce(version)
    sandbox.assert.calledOnce(login)
  })
})
