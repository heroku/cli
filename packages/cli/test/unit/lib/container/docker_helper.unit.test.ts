import * as DockerHelper from '../../../../src/lib/container/docker_helper'
import {expect} from 'chai'
import * as sinon from 'sinon'
import * as path from 'path'
import * as childProcess from 'child_process'
import * as inquirer from 'inquirer'

const EventEmitter = require('events').EventEmitter

describe('DockerHelper', function () {
  const eventMock = () => {
    const eventEmitter = new EventEmitter()
    process.nextTick(function () {
      eventEmitter.emit('exit', 0)
    })
    return eventEmitter
  }

  describe('.version', function () {
    let sandbox: sinon.SinonSandbox

    beforeEach(function () {
      sandbox = sinon.createSandbox()
    })

    afterEach(function () {
      return sandbox.restore()
    })

    it('returns a the major and minor version', async function () {
      sandbox.stub(DockerHelper, 'cmd')
        .withArgs('docker', ['version', '-f', '{{.Client.Version}}'], {output: true})
        .resolves('18.02.0-ce-rc2')

      const version = await DockerHelper.version()

      expect(version).to.deep.equal([18, 2])
    })

    it('has an error', async function () {
      sandbox.stub(DockerHelper, 'cmd')
        .withArgs('docker', ['version', '-f', '{{.Client.Version}}'], {output: true})
        .resolves('an error occurred')

      const version = await DockerHelper.version()

      expect(version).to.deep.equal([0, 0])
    })
  })

  describe('.pullImage', function () {
    let eventStub: sinon.SinonStub

    beforeEach(function () {
      eventStub = sinon.stub(childProcess, 'spawn')
        .callsFake(eventMock)
    })

    afterEach(function () {
      eventStub.restore()
    })

    it('successfully pulls image to execute with DockerHelper cmd', async function () {
      await DockerHelper.pullImage('registry.heroku.com/testapp/web')
      expect(eventStub.calledOnce).to.equal(true)
    })
  })

  describe('.getDockerfiles', function () {
    it('can recurse the directory', function () {
      const searchpath = path.join(process.cwd(), './test/fixtures/container')
      const results = DockerHelper.getDockerfiles(searchpath, true)
      expect(results).to.have.members([path.join(`${searchpath}`, 'Dockerfile.web'), path.join(`${searchpath}`, 'Nested', 'Dockerfile.web')])
    })

    it('when recursing, rejects dockerfiles that have no postfix in the name', function () {
      const searchpath = path.join(process.cwd(), './test/fixtures/container')
      const results = DockerHelper.getDockerfiles(searchpath, true)
      expect(results).to.not.have.members([`${searchpath}/Dockerfile`])
    })

    it('returns only regular Dockerfiles when not recursing', function () {
      const searchpath = path.join(process.cwd(), './test/fixtures/container/Nested')
      const results = DockerHelper.getDockerfiles(searchpath, false)
      expect(results).to.have.members([path.join(`${searchpath}`, 'Dockerfile')])
    })
  })

  describe('.getJobs', function () {
    it('returns objects representing jobs per Dockerfile', function () {
      const dockerfiles = [
        path.join('.', 'Dockerfile.web'), path.join('.', 'Nested', 'Dockerfile.web'),
      ]
      const resourceRoot = 'rootfulroot'
      const results = DockerHelper.getJobs(resourceRoot, dockerfiles)
      expect(results.web).to.have.property('length', 2)
      expect(results.web[0]).to.have.property('depth', 1, 'dockerfile')
      expect(results.web[0]).to.have.property('dockerfile', 'Dockerfile.web')
      expect(results.web[0]).to.have.property('postfix', 1)
      expect(results.web[1]).to.have.property('depth', 2, 'dockerfile')
      expect(results.web[1]).to.have.property('dockerfile', path.join('.', 'Nested', 'Dockerfile.web'))
      expect(results.web[1]).to.have.property('postfix', 1)
    })

    it('sorts dockerfiles by directory depth, then proc type', function () {
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

    it('groups the jobs by process type', function () {
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

  describe('.runImage', function () {
    let eventStub: sinon.SinonStub

    beforeEach(function () {
      eventStub = sinon.stub(childProcess, 'spawn')
        .callsFake(eventMock)
    })

    afterEach(function () {
      eventStub.restore()
    })

    it('successfully runs image to execute with and without shell command', async function () {
      await DockerHelper.runImage('registry.heroku.com/testapp/web', '', 1234)
      await DockerHelper.runImage('registry.heroku.com/testapp/web', 'not empty', 1234)
      expect(eventStub.calledTwice).to.equal(true)
    })
  })

  describe('.filterByProcessType', function () {
    it('returns an array of jobs only of the type requested', async function () {
      const dockerfiles = [
        path.join('.', 'Nested', 'Dockerfile.worker'),
        path.join('.', 'Dockerfile.web'),
        path.join('.', 'Nested', 'Dockerfile'),
      ]
      const resourceRoot = 'rootfulroot'
      const jobs = DockerHelper.getJobs(resourceRoot, dockerfiles)
      const filteredJobs = DockerHelper.filterByProcessType(jobs, ['web'])

      expect(filteredJobs).to.have.property('web')
      expect(filteredJobs.web[0].name).to.equal('web')
    })
  })

  describe('.chooseJobs', function () {
    afterEach(function () {
      inquirer.prompt.restoreDefaultPrompts()
    })

    it('returns the entry when only one exists', async function () {
      const dockerfiles = [path.join('.', 'Nested', 'Dockerfile.web')]
      const jobs = DockerHelper.getJobs('rootfulroot', dockerfiles)
      const chosenJob = await DockerHelper.chooseJobs(jobs)

      expect(chosenJob[0]).to.have.property('dockerfile', dockerfiles[0])
      expect(chosenJob).to.have.property('length', 1)
    })
  })

  describe('.chooseJobs multiple entries', function () {
    const sandbox = sinon.createSandbox()
    const dockerfilePath = path.join('.', 'Nested', 'Dockerfile.web')

    beforeEach(function () {
      sandbox.stub(inquirer, 'prompt').resolves({web: dockerfilePath})
    })

    afterEach(function () {
      sandbox.restore()
      inquirer.prompt.restoreDefaultPrompts()
    })

    it('prompts user when multiple entries exists', async function () {
      const dockerfiles = [path.join('.', 'Nested', 'Dockerfile.web'), path.join('.', 'Dockerfile.web')]
      const jobs = DockerHelper.getJobs('rootfulroot', dockerfiles)
      const chosenJob = await DockerHelper.chooseJobs(jobs)

      expect(chosenJob[0]).to.have.property('dockerfile', dockerfiles[0])
      expect(chosenJob).to.have.property('length', 1)
    })
  })

  describe('.pushImage', function () {
    const sandbox = sinon.createSandbox()

    afterEach(function () {
      return sandbox.restore()
    })

    it('successfully pushes image to DockerHelper cmd', async function () {
      const eventStub = sandbox.stub(childProcess, 'spawn').callsFake(eventMock)

      await DockerHelper.pushImage('registry.heroku.com/testapp/web')

      expect(eventStub.calledOnce).to.equal(true)
    })
  })
})
