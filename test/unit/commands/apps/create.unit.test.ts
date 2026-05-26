import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {execSync} from 'node:child_process'
import * as sinon from 'sinon'
import {SinonStub} from 'sinon'

import CreateCommand from '../../../../src/commands/apps/create.js'

type FakePlatform = {
  addOn: {create: sinon.SinonStub}
  app: {create: sinon.SinonStub}
  buildpackInstallation: {update: sinon.SinonStub}
  configVar: {update: sinon.SinonStub}
  teamApp: {create: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    addOn: {create: sinon.stub()},
    app: {create: sinon.stub()},
    buildpackInstallation: {update: sinon.stub()},
    configVar: {update: sinon.stub()},
    teamApp: {create: sinon.stub()},
  }
}

describe('apps:create', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
    // Clean up any heroku git remotes created by the tests
    try {
      const remotes = execSync('git remote', {encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore']})
      if (remotes.includes('heroku')) {
        execSync('git remote remove heroku', {stdio: 'ignore'})
      }
    } catch {
      // Ignore errors
    }
  })

  it('creates an app', async function () {
    fakePlatform.app.create.resolves({
      name: 'foobar',
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    })

    const {stderr, stdout} = await runCommand(CreateCommand, [])

    expect(stderr).to.contain('Creating app... done, ⬢ foobar')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    expect(fakePlatform.app.create.calledOnce).to.equal(true)
  })

  it('creates an app with feature flags', async function () {
    fakePlatform.app.create.resolves({
      name: 'foobar',
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    })

    const {stderr, stdout} = await runCommand(CreateCommand, ['--features', 'feature-1,feature-2'])

    expect(stderr).to.contain('Creating app... done, ⬢ foobar')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    expect(fakePlatform.app.create.firstCall.args[0]).to.include({feature_flags: 'feature-1,feature-2'})
  })

  it('creates an app in a space', async function () {
    fakePlatform.teamApp.create.resolves({
      name: 'foobar',
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    })

    const {stderr, stdout} = await runCommand(CreateCommand, ['--space', 'my-space-name'])

    expect(stderr).to.contain('Creating app in space my-space-name... done, ⬢ foobar')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    expect(fakePlatform.teamApp.create.firstCall.args[0]).to.include({space: 'my-space-name'})
    expect(fakePlatform.app.create.called).to.equal(false)
  })

  it('creates an Internal Web App in a space', async function () {
    fakePlatform.teamApp.create.resolves({
      internal_routing: true,
      name: 'foobar',
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    })

    const {stderr, stdout} = await runCommand(CreateCommand, ['--space', 'my-space-name', '--internal-routing'])

    expect(stderr).to.contain('Creating app in space my-space-name... done, ⬢ foobar')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    expect(fakePlatform.teamApp.create.firstCall.args[0]).to.include({
      internal_routing: true,
      space: 'my-space-name',
    })
  })

  it('does not create an Internal Web App outside of a space', async function () {
    const {error} = await runCommand(CreateCommand, ['--internal-routing'])

    expect(error).to.be.an.instanceof(Error)
    expect(error?.message).to.equal('Space name required.\nInternal Web Apps are only available for Private Spaces.\nUSAGE: heroku apps:create --space my-space --internal-routing')
    expect(fakePlatform.app.create.called).to.equal(false)
    expect(fakePlatform.teamApp.create.called).to.equal(false)
  })

  it('creates an app & returns as json', async function () {
    const json = {
      name: 'foobar',
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    }

    fakePlatform.app.create.resolves(json)

    const {stderr, stdout} = await runCommand(CreateCommand, ['--json'])

    expect(stderr).to.contain('Creating app... done, ⬢ foobar')
    expect(JSON.parse(stdout)).to.deep.equal(json)
  })

  describe('testing manifest flag', function () {
    const appName = 'foo'

    const manifest = {
      build: {
        config: {FOO: 'bar', RAILS_ENV: 'development'},
        docker: {web: 'Dockerfile', worker: 'worker/Dockerfile'},
      },
      release: {command: ['./deployment-tasks.sh'], image: 'worker'},
      run: {
        'asset-syncer': {command: ['python asset-syncer.py'], image: 'worker'},
        web: 'bundle exec puma -C config/puma.rb',
        worker: 'python myworker.py',
      },
      setup: {addons: [{as: 'DATABASE', plan: 'heroku-postgresql'}], config: {S3_BUCKET: 'my-example-bucket'}},
    }

    let readManifestStub: SinonStub

    beforeEach(async function () {
      readManifestStub = sinon.stub(CreateCommand.prototype, 'readManifest').resolves(manifest)
    })

    afterEach(function () {
      readManifestStub.restore()
    })

    it('sets config vars when manifest flag is present', async function () {
      fakePlatform.app.create.resolves({
        name: appName,
        stack: {name: 'cedar-14'},
        web_url: 'https://foobar.com',
      })
      fakePlatform.addOn.create.resolves({})
      fakePlatform.configVar.update.resolves({})

      // Override channel using environment variable for this test
      process.env.HEROKU_UPDATE_CHANNEL = 'beta'

      const {stderr, stdout} = await runCommand(CreateCommand, ['--app', appName, '--manifest'])

      expect(stderr).to.contain('Reading heroku.yml manifest... done')
      expect(stderr).to.contain('Creating ⬢ foo... done')
      expect(stderr).to.contain('Adding heroku-postgresql... done')
      expect(stderr).to.contain('Setting config vars... done')
      expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foo.git\n')
      expect(fakePlatform.app.create.firstCall.args[0]).to.include({name: 'foo', stack: 'container'})
      expect(fakePlatform.addOn.create.calledOnceWithExactly(appName, {
        attachment: {name: 'DATABASE'},
        plan: 'heroku-postgresql',
      })).to.equal(true)
      expect(fakePlatform.configVar.update.calledOnceWithExactly(appName, {S3_BUCKET: 'my-example-bucket'})).to.equal(true)

      delete process.env.HEROKU_UPDATE_CHANNEL
    })
  })

  describe('apps:create with buildpack & addon flags', function () {
    const appName = 'foo'
    const addon = 'foobar, secondPlan'

    it('adds addon if addons flag is present', async function () {
      fakePlatform.app.create.resolves({
        name: appName,
        stack: {name: 'cedar-14'},
        web_url: 'https://foobar.com',
      })
      fakePlatform.addOn.create.resolves({})

      const {stderr, stdout} = await runCommand(CreateCommand, ['--app', appName, '--addons', addon])

      expect(stderr).to.contain('Creating ⬢ foo... done')
      expect(stderr).to.contain('Adding foobar... done')
      expect(stderr).to.contain('Adding secondPlan... done')
      expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foo.git\n')
      expect(fakePlatform.addOn.create.callCount).to.equal(2)
      expect(fakePlatform.addOn.create.firstCall.args).to.deep.equal([appName, {attachment: undefined, plan: 'foobar'}])
      expect(fakePlatform.addOn.create.secondCall.args).to.deep.equal([appName, {attachment: undefined, plan: 'secondPlan'}])
    })

    it('sets buildpack if buildpack flag is present', async function () {
      const exampleBuildpack = 'https://github.com/some/buildpack.git'

      fakePlatform.app.create.resolves({
        name: appName,
        stack: {name: 'cedar-14'},
        web_url: 'https://foobar.com',
      })
      fakePlatform.addOn.create.resolves({})
      fakePlatform.buildpackInstallation.update.resolves([])

      const {stderr, stdout} = await runCommand(CreateCommand, ['--app', appName, '--addons', addon, '--buildpack', exampleBuildpack])

      expect(stderr).to.contain('Creating ⬢ foo... done')
      expect(stderr).to.contain('Adding foobar... done')
      expect(stderr).to.contain('Adding secondPlan... done')
      expect(stderr).to.contain('Setting buildpack to https://github.com/some/buildpack.git')
      expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foo.git\n')
      expect(fakePlatform.buildpackInstallation.update.calledOnceWithExactly(appName, {
        updates: [{buildpack: exampleBuildpack}],
      })).to.equal(true)
    })
  })

  it('creates an app in the region', async function () {
    fakePlatform.app.create.resolves({
      name: 'foobar',
      region: {name: 'eu'},
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    })

    const {stderr, stdout} = await runCommand(CreateCommand, ['--region', 'eu'])

    expect(stderr).to.contain('Creating app... done, ⬢ foobar, region is eu')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    expect(fakePlatform.app.create.firstCall.args[0]).to.include({region: 'eu'})
  })

  it('creates an with stack', async function () {
    fakePlatform.app.create.resolves({
      name: 'foobar',
      stack: {name: 'test'},
      web_url: 'https://foobar.com',
    })

    const {stderr, stdout} = await runCommand(CreateCommand, ['--stack', 'test'])

    expect(stderr).to.contain('Creating app... done, ⬢ foobar, stack is test')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    expect(fakePlatform.app.create.firstCall.args[0]).to.include({stack: 'test'})
  })
})
