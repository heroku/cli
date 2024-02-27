import * as DockerHelper from '../../../../src/lib/container/docker_helper'
import {expect} from 'chai'
import * as sinon from 'sinon'
import * as path from 'path'
import * as childProcess from 'child_process'
const EventEmitter = require('events').EventEmitter

describe('DockerHelper', () => {
  const eventMock = () => {
    const eventEmitter = new EventEmitter()
    process.nextTick(function () {
      eventEmitter.emit('exit', 0)
    })
    return eventEmitter
  }

  describe('.version', () => {
    let sandbox: sinon.SinonSandbox

    beforeEach(() => {
      sandbox = sinon.createSandbox()
    })
    afterEach(() => sandbox.restore())

    it('returns a the major and minor version', async function () {
      sandbox.stub(DockerHelper, 'cmd')
        .withArgs('docker', ['version', '-f', '{{.Client.Version}}'], {output: true})
        .resolves('18.02.0-ce-rc2')

      const version = await DockerHelper.version()

      expect(version).to.deep.equal([18, 2])
    })

    it('has an error', async () => {
      sandbox.stub(DockerHelper, 'cmd')
        .withArgs('docker', ['version', '-f', '{{.Client.Version}}'], {output: true})
        .resolves('an error occured')

      const version = await DockerHelper.version()

      expect(version).to.deep.equal([0, 0])
    })
  })
  describe('.getDockerfiles', () => {
    it('can recurse the directory', () => {
      const searchpath = path.join(process.cwd(), './test/fixtures')
      const results = DockerHelper.getDockerfiles(searchpath, true)
      expect(results).to.have.members([path.join(`${searchpath}`, 'Dockerfile.web'), path.join(`${searchpath}`, 'Nested', 'Dockerfile.web')])
    })
    it('when recursing, rejects dockerfiles that have no postfix in the name', () => {
      const searchpath = path.join(process.cwd(), './test/fixtures')
      const results = DockerHelper.getDockerfiles(searchpath, true)
      expect(results).to.not.have.members([`${searchpath}/Dockerfile`])
    })
    it('returns only regular Dockerfiles when not recursing', () => {
      const searchpath = path.join(process.cwd(), './test/fixtures/Nested')
      const results = DockerHelper.getDockerfiles(searchpath, false)
      expect(results).to.have.members([path.join(`${searchpath}`, 'Dockerfile')])
    })
  })
  describe('.getJobs', () => {
    it('returns objects representing jobs per Dockerfile', () => {
      const dockerfiles = [
        path.join('.', 'Dockerfile.web'), path.join('.', 'Nested', 'Dockerfile.web'),
      ]
      const resourceRoot = 'rootfulroot'
      const results = DockerHelper.getJobs(resourceRoot, dockerfiles)
      expect(results.web).to.have.property('length', 2)
      expect(results.web[0]).to.have.property('depth', 1, 'dockerfile')
      expect(results.web[0]).to.have.property('dockerfile', './Dockerfile.web')
      expect(results.web[0]).to.have.property('postfix', 1)
      expect(results.web[1]).to.have.property('depth', 2, 'dockerfile')
      expect(results.web[1]).to.have.property('dockerfile', './Nested/Dockerfile.web')
      expect(results.web[1]).to.have.property('postfix', 1)
    })
    it('sorts dockerfiles by directory depth, then proc type', () => {
      const dockerfiles = [
        path.join('.', 'Nested', 'Dockerfile.worker'), path.join('.', 'Dockerfile.web'), path.join('.', 'Nested', 'Dockerfile'),
      ]
      const resourceRoot = 'rootfulroot'
      const results = DockerHelper.getJobs(resourceRoot, dockerfiles)
      expect(results.web).to.have.property('length', 1)
      expect(results.web[0]).to.have.property('dockerfile', 'Dockerfile.web')
      expect(results.standard[0]).to.have.property('dockerfile', path.join('Nested', 'Dockerfile'))
      expect(results.worker[0]).to.have.property('dockerfile', path.join('Nested', 'Dockerfile.worker'))
    })
    it('groups the jobs by process type', () => {
      const dockerfiles = [
        path.join('.', 'Nested', 'Dockerfile.worker'), path.join('.', 'Dockerfile.web'), path.join('.', 'Nested', 'Dockerfile'),
      ]
      const resourceRoot = 'rootfulroot'
      const results = DockerHelper.getJobs(resourceRoot, dockerfiles)
      expect(results).to.have.keys('worker', 'web', 'standard')
      expect(results.worker.map((j: { dockerfile: any }) => j.dockerfile)).to.have.members([path.join('.', 'Nested', 'Dockerfile.worker')])
      expect(results.web.map((j: { dockerfile: any }) => j.dockerfile)).to.have.members([path.join('.', 'Dockerfile.web')])
      expect(results.standard.map((j: { dockerfile: any }) => j.dockerfile)).to.have.members([path.join('.', 'Nested', 'Dockerfile')])
    })
  })

  describe('.runImage', () => {
    let eventStub: sinon.SinonStub
    beforeEach(() => {
      eventStub = sinon.stub(childProcess, 'spawn')
        .callsFake(eventMock)
    })
    it('successfully runs image to execute with Sanbashi cmd', async () => {
      await DockerHelper.runImage('registry.heroku.com/testapp/web', '', 1234)
      await DockerHelper.runImage('registry.heroku.com/testapp/web', 'not empty', 1234)
      expect(eventStub.calledTwice).to.equal(true)
    })
    afterEach(() => {
      eventStub.restore()
    })
  })
})
