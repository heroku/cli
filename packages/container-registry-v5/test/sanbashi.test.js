/* eslint-env mocha */
let Sinon = require('sinon')
let Sanbashi = require('../lib/sanbashi')
let expect = require('chai').expect
let Path = require('path')
let Inquirer = require('inquirer')
let childProcess = require('child_process')
let EventEmitter = require('events').EventEmitter

const eventMock = () => {
  let eventEmitter = new EventEmitter()
  process.nextTick(function () {
    eventEmitter.emit('exit', 0)
  })
  return eventEmitter
}

describe('Sanbashi', () => {
  describe('.getDockerfiles', () => {
    it('can recurse the directory', () => {
      const searchpath = Path.join(process.cwd(), './test/fixtures')
      let results = Sanbashi.getDockerfiles(searchpath, true)
      expect(results).to.have.members([Path.join(`${searchpath}`, 'Dockerfile.web'), Path.join(`${searchpath}`, 'Nested', 'Dockerfile.web')])
    })
    it('when recursing, rejects dockerfiles that have no postfix in the name', () => {
      const searchpath = Path.join(process.cwd(), './test/fixtures')
      let results = Sanbashi.getDockerfiles(searchpath, true)
      expect(results).to.not.have.members([`${searchpath}/Dockerfile`])
    })
    it('returns only regular Dockerfiles when not recursing', () => {
      const searchpath = Path.join(process.cwd(), './test/fixtures/Nested')
      let results = Sanbashi.getDockerfiles(searchpath, false)
      expect(results).to.have.members([Path.join(`${searchpath}`, 'Dockerfile')])
    })
  })
  describe('.filterByProcessType', () => {
    it('returns an array of jobs only of the type requested', () => {
      const dockerfiles = [
        Path.join('.', 'Nested', 'Dockerfile.worker'),
        Path.join('.', 'Dockerfile.web'),
        Path.join('.', 'Nested', 'Dockerfile'),
      ]
      const resourceRoot = 'rootfulroot'
      const jobs = Sanbashi.getJobs(resourceRoot, dockerfiles)
      const filteredJobs = Sanbashi.filterByProcessType(jobs, ['web'])
      expect(filteredJobs).to.have.property('web')
      expect(filteredJobs.web[0].name).to.equal('web')
    })
  })
  describe('.getJobs', () => {
    it('returns objects representing jobs per Dockerfile', () => {
      const dockerfiles = [
        Path.join('.', 'Dockerfile.web'),
        Path.join('.', 'Nested', 'Dockerfile.web'),
      ]
      const resourceRoot = 'rootfulroot'
      const results = Sanbashi.getJobs(resourceRoot, dockerfiles)
      expect(results.web).to.have.property('length', 2)
      expect(results.web[0]).to.have.property('depth', 1, 'dockerfile', './Dockerfile.web', 'postfix', 1)
      expect(results.web[1]).to.have.property('depth', 2, 'dockerfile', './Nested/Dockerfile.web', 'postfix', 1)
    })
    it('sorts dockerfiles by directory depth, then proc type', () => {
      const dockerfiles = [
        Path.join('.', 'Nested', 'Dockerfile.worker'),
        Path.join('.', 'Dockerfile.web'),
        Path.join('.', 'Nested', 'Dockerfile'),
      ]
      const resourceRoot = 'rootfulroot'
      const results = Sanbashi.getJobs(resourceRoot, dockerfiles)
      expect(results.web).to.have.property('length', 1)
      expect(results.web[0]).to.have.property('dockerfile', 'Dockerfile.web')
      expect(results.standard[0]).to.have.property('dockerfile', Path.join('Nested', 'Dockerfile'))
      expect(results.worker[0]).to.have.property('dockerfile', Path.join('Nested', 'Dockerfile.worker'))
    })
    it('groups the jobs by process type', () => {
      const dockerfiles = [
        Path.join('.', 'Nested', 'Dockerfile.worker'),
        Path.join('.', 'Dockerfile.web'),
        Path.join('.', 'Nested', 'Dockerfile'),
      ]
      const resourceRoot = 'rootfulroot'
      const results = Sanbashi.getJobs(resourceRoot, dockerfiles)
      expect(results).to.have.keys('worker', 'web', 'standard')
      expect(results.worker.map(j => j.dockerfile)).to.have.members([Path.join('.', 'Nested', 'Dockerfile.worker')])
      expect(results.web.map(j => j.dockerfile)).to.have.members([Path.join('.', 'Dockerfile.web')])
      expect(results.standard.map(j => j.dockerfile)).to.have.members([Path.join('.', 'Nested', 'Dockerfile')])
    })
  })
  describe('.chooseJobs', () => {
    it('returns the entry when only one exists', async () => {
      const dockerfiles = [Path.join('.', 'Nested', 'Dockerfile.web')]
      const jobs = Sanbashi.getJobs('rootfulroot', dockerfiles)
      let chosenJob = await Sanbashi.chooseJobs(jobs)
      expect(chosenJob[0]).to.have.property('dockerfile', dockerfiles[0])
      expect(chosenJob).to.have.property('length', 1)
    })
    afterEach(() => {
      if (Inquirer.prompt.restore) {
        Inquirer.prompt.restore()
      }
    })
  })
  describe('.chooseJobs multiple entries', () => {
    let promptStub
    const dockerfilePath = Path.join('.', 'Nested', 'Dockerfile.web')
    beforeEach(() => {
      promptStub = Sinon.stub(Inquirer, 'prompt').returns({web: dockerfilePath})
    })

    it('prompts user when multiple entries exists', async () => {
      const dockerfiles = [Path.join('.', 'Nested', 'Dockerfile.web'), Path.join('.', 'Dockerfile.web')]
      const jobs = Sanbashi.getJobs('rootfulroot', dockerfiles)
      let chosenJob = await Sanbashi.chooseJobs(jobs)
      expect(chosenJob[0]).to.have.property('dockerfile', dockerfiles[0])
      expect(chosenJob).to.have.property('length', 1)
    })
    afterEach(() => {
      promptStub.restore()
      if (Inquirer.prompt.restore) {
        Inquirer.prompt.restore()
      }
    })
  })
  describe('.pushImage', () => {
    let eventStub

    beforeEach(() => {
      eventStub = Sinon.stub(childProcess, 'spawn').callsFake(eventMock)
    })

    it('successfully pushes image to Sanbashi cmd', async () => {
      await Sanbashi.pushImage('registry.heroku.com/testapp/web')
      expect(eventStub.calledOnce).to.equal(true)
    })

    afterEach(() => {
      eventStub.restore()
      if (Inquirer.prompt.restore) {
        Inquirer.prompt.restore()
      }
    })
  })
  describe('.pullImage', () => {
    let eventStub

    beforeEach(() => {
      eventStub = Sinon.stub(childProcess, 'spawn').callsFake(eventMock)
    })

    it('successfully pulls image to execute with Sanbashi cmd', async () => {
      await Sanbashi.pullImage('registry.heroku.com/testapp/web')
      expect(eventStub.calledOnce).to.equal(true)
    })

    afterEach(() => {
      eventStub.restore()
      if (Inquirer.prompt.restore) {
        Inquirer.prompt.restore()
      }
    })
  })
  describe('.runImage', () => {
    let eventStub

    beforeEach(() => {
      eventStub = Sinon.stub(childProcess, 'spawn').callsFake(eventMock)
    })

    it('successfully runs image to execute with Sanbashi cmd', async () => {
      await Sanbashi.runImage('registry.heroku.com/testapp/web', '', '1234')
      await Sanbashi.runImage('registry.heroku.com/testapp/web', 'not empty', '1234')
      expect(eventStub.calledTwice).to.equal(true)
    })

    afterEach(() => {
      eventStub.restore()
      if (Inquirer.prompt.restore) {
        Inquirer.prompt.restore()
      }
    })
  })
  describe('.buildImage', () => {
    let path = Path.join(process.cwd(), './test/fixtures')
    let dockerfile = Path.join(path, 'Dockerfile.web')
    let resource = 'web'

    it('set build-time variables', () => {
      let buildArg = ['ENV=live', 'HTTPS=on']
      let cmd = Sinon.stub(Sanbashi, 'cmd')
      Sanbashi.buildImage(dockerfile, resource, buildArg)
      let dockerArg = ['build', '-f', dockerfile, '-t', 'web', '--build-arg', 'ENV=live', '--build-arg', 'HTTPS=on', path]
      Sinon.assert.calledWith(cmd, 'docker', dockerArg)
    })

    it('skip build-time variables if empty', () => {
      let buildArg = ['']
      let cmd = Sinon.stub(Sanbashi, 'cmd')
      Sanbashi.buildImage(dockerfile, resource, buildArg)
      let dockerArg = ['build', '-f', dockerfile, '-t', 'web', path]
      Sinon.assert.calledWith(cmd, 'docker', dockerArg)
    })

    it('set build path', () => {
      let buildArg = ['']
      let buildPath = 'build/context'
      let cmd = Sinon.stub(Sanbashi, 'cmd')
      Sanbashi.buildImage(dockerfile, resource, buildArg, buildPath)
      let dockerArg = ['build', '-f', dockerfile, '-t', 'web', buildPath]
      Sinon.assert.calledWith(cmd, 'docker', dockerArg)
    })

    afterEach(() => {
      Sanbashi.cmd.restore() // Unwraps the spy
    })
  })
  describe('.version', () => {
    it('returns a the major and minor version', async () => {
      Sinon.stub(Sanbashi, 'cmd')
        .withArgs('docker', ['version', '-f', '{{.Client.Version}}'], {output: true})
        .resolves('18.02.0-ce-rc2')

      let version = await Sanbashi.version()
      expect(version).to.deep.equal([18, 2])
    })

    it('has an error', async () => {
      Sinon.stub(Sanbashi, 'cmd')
        .withArgs('docker', ['version', '-f', '{{.Client.Version}}'], {output: true})
        .resolves('an error occured')

      let version = await Sanbashi.version()
      expect(version).to.deep.equal([0, 0])
    })

    afterEach(() => {
      Sanbashi.cmd.restore() // Unwraps the spy
    })
  })
})
