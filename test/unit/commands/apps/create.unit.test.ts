import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'

import CreateCommand from '../../../../src/commands/apps/create.js'
import Git from '../../../../src/lib/git/git.js'
import {runCommand} from '../../../helpers/run-command.js'

describe('apps:create', function () {
  let api: nock.Scope
  let configureCredentialHelperStub: sinon.SinonStub
  let gitCreateRemoteStub: sinon.SinonStub

  beforeEach(function () {
    api = nock('https://api.heroku.com')

    configureCredentialHelperStub = sinon.stub(Git.prototype, 'configureCredentialHelper').resolves()
    gitCreateRemoteStub = sinon.stub(Git.prototype, 'createRemote').resolves()
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()

    configureCredentialHelperStub.restore()
    gitCreateRemoteStub.restore()
  })

  it('creates an app', async function () {
    api
      .post('/apps', {})
      .reply(200, {
        name: 'foobar',
        stack: {name: 'cedar-14'},
        web_url: 'https://foobar.com',
      })

    const {stderr, stdout} = await runCommand(CreateCommand, [])

    expect(stderr).to.contain('Creating app... done, ⬢ foobar')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
  })

  it('creates an app with feature flags', async function () {
    api
      .post('/apps', {feature_flags: 'feature-1,feature-2'})
      .reply(200, {
        name: 'foobar',
        stack: {name: 'cedar-14'},
        web_url: 'https://foobar.com',
      })

    const {stderr, stdout} = await runCommand(CreateCommand, ['--features', 'feature-1,feature-2'])

    expect(stderr).to.contain('Creating app... done, ⬢ foobar')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
  })

  it('creates an app in a space', async function () {
    api
      .post('/teams/apps', {
        space: 'my-space-name',
      })
      .reply(200, {
        name: 'foobar',
        stack: {name: 'cedar-14'},
        web_url: 'https://foobar.com',
      })

    const {stderr, stdout} = await runCommand(CreateCommand, ['--space', 'my-space-name'])

    expect(stderr).to.contain('Creating app in space my-space-name... done, ⬢ foobar')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
  })

  it('creates an Internal Web App in a space', async function () {
    api
      .post('/teams/apps', {
        internal_routing: true,
        space: 'my-space-name',
      })
      .reply(200, {
        internal_routing: true,
        name: 'foobar',
        stack: {name: 'cedar-14'},
        web_url: 'https://foobar.com',
      })

    const {stderr, stdout} = await runCommand(CreateCommand, ['--space', 'my-space-name', '--internal-routing'])

    expect(stderr).to.contain('Creating app in space my-space-name... done, ⬢ foobar')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
  })

  it('does not create an Internal Web App outside of a space', async function () {
    const {error} = await runCommand(CreateCommand, ['--internal-routing'])

    expect(error).to.be.an.instanceof(Error)
    expect(error?.message).to.equal('Space name required.\nInternal Web Apps are only available for Private Spaces.\nUSAGE: heroku apps:create --space my-space --internal-routing')
  })

  it('creates an app & returns as json', async function () {
    const json = {
      name: 'foobar',
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    }

    api
      .post('/apps', {})
      .reply(200, json)

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

    let readManifestStub: sinon.SinonStub

    beforeEach(async function () {
      readManifestStub = sinon.stub(CreateCommand.prototype, 'readManifest').resolves(manifest)
    })

    afterEach(function () {
      readManifestStub.restore()
    })

    it('sets config vars when manifest flag is present', async function () {
      api
        .post('/apps', {name: 'foo', stack: 'container'})
        .reply(200, {
          name: appName,
          stack: {name: 'cedar-14'},
          web_url: 'https://foobar.com',
        })
        .post(`/apps/${appName}/addons`)
        .reply(200, [])
        .patch(`/apps/${appName}/config-vars`, {S3_BUCKET: 'my-example-bucket'})
        .reply(200, [])

      // Override channel using environment variable for this test
      process.env.HEROKU_UPDATE_CHANNEL = 'beta'

      const {stderr, stdout} = await runCommand(CreateCommand, ['--app', appName, '--manifest'])

      expect(stderr).to.contain('Reading heroku.yml manifest... done')
      expect(stderr).to.contain('Creating ⬢ foo... done')
      expect(stderr).to.contain('Adding heroku-postgresql... done')
      expect(stderr).to.contain('Setting config vars... done')
      expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foo.git\n')

      delete process.env.HEROKU_UPDATE_CHANNEL
    })
  })

  describe('apps:create with buildpack & addon flags', function () {
    const appName = 'foo'
    const addon = 'foobar, secondPlan'

    it('adds addon if addons flag is present', async function () {
      api
        .post('/apps', {name: 'foo'})
        .reply(200, {
          name: appName,
          stack: {name: 'cedar-14'},
          web_url: 'https://foobar.com',
        })
        .post(`/apps/${appName}/addons`, {plan: 'foobar'})
        .reply(200, [])
        .post(`/apps/${appName}/addons`, {plan: 'secondPlan'})
        .reply(200, [])

      const {stderr, stdout} = await runCommand(CreateCommand, ['--app', appName, '--addons', addon])

      expect(stderr).to.contain('Creating ⬢ foo... done')
      expect(stderr).to.contain('Adding foobar... done')
      expect(stderr).to.contain('Adding secondPlan... done')
      expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foo.git\n')
    })

    it('sets buildpack if buildpack flag is present', async function () {
      const exampleBuildpack = 'https://github.com/some/buildpack.git'

      api
        .post('/apps', {name: 'foo'})
        .reply(200, {
          name: appName,
          stack: {name: 'cedar-14'},
          web_url: 'https://foobar.com',
        })
        .post(`/apps/${appName}/addons`, {plan: 'foobar'})
        .reply(200, [])
        .post(`/apps/${appName}/addons`, {plan: 'secondPlan'})
        .reply(200, [])
        .put(`/apps/${appName}/buildpack-installations`, {updates: [{buildpack: 'https://github.com/some/buildpack.git'}]})
        .reply(200, [])

      const {stderr, stdout} = await runCommand(CreateCommand, ['--app', appName, '--addons', addon, '--buildpack', exampleBuildpack])

      expect(stderr).to.contain('Creating ⬢ foo... done')
      expect(stderr).to.contain('Adding foobar... done')
      expect(stderr).to.contain('Adding secondPlan... done')
      expect(stderr).to.contain('Setting buildpack to https://github.com/some/buildpack.git')
      expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foo.git\n')
    })
  })

  it('creates an app in the region', async function () {
    api
      .post('/apps', {region: 'eu'})
      .reply(200, {
        name: 'foobar',
        region: {name: 'eu'},
        stack: {name: 'cedar-14'},
        web_url: 'https://foobar.com',
      })

    const {stderr, stdout} = await runCommand(CreateCommand, ['--region', 'eu'])

    expect(stderr).to.contain('Creating app... done, ⬢ foobar, region is eu')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
  })

  it('creates an with stack', async function () {
    api
      .post('/apps', {stack: 'test'})
      .reply(200, {
        name: 'foobar',
        stack: {name: 'test'},
        web_url: 'https://foobar.com',
      })

    const {stderr, stdout} = await runCommand(CreateCommand, ['--stack', 'test'])

    expect(stderr).to.contain('Creating app... done, ⬢ foobar, stack is test')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
  })

  describe('git operations', function () {
    it('creates a remote when in a git repository and --no-remote is not used', async function () {
      api
        .post('/apps', {})
        .reply(200, {
          name: 'foobar',
          stack: {name: 'cedar-14'},
          web_url: 'https://foobar.com',
        })

      await runCommand(CreateCommand, [])

      expect(gitCreateRemoteStub.calledOnce).to.be.true
    })

    it('does not create a remote when not in a git repository', async function () {
      const inGitRepoStub = sinon.stub(Git.prototype, 'inGitRepo').returns(false)

      api
        .post('/apps', {})
        .reply(200, {
          name: 'foobar',
          stack: {name: 'cedar-14'},
          web_url: 'https://foobar.com',
        })

      try {
        await runCommand(CreateCommand, [])
        expect(gitCreateRemoteStub.called).to.be.false
      } finally {
        inGitRepoStub.restore()
      }
    })

    it('does not create a remote when --no-remote is used', async function () {
      api
        .post('/apps', {})
        .reply(200, {
          name: 'foobar',
          stack: {name: 'cedar-14'},
          web_url: 'https://foobar.com',
        })

      await runCommand(CreateCommand, ['--no-remote'])

      expect(gitCreateRemoteStub.called).to.be.false
    })

    it('configures git credential helper when creating a remote', async function () {
      api
        .post('/apps', {})
        .reply(200, {
          name: 'foobar',
          stack: {name: 'cedar-14'},
          web_url: 'https://foobar.com',
        })

      await runCommand(CreateCommand, [])

      expect(configureCredentialHelperStub.calledOnce).to.be.true
    })

    it('does not configure git credential helper when --no-remote is used', async function () {
      api
        .post('/apps', {})
        .reply(200, {
          name: 'foobar',
          stack: {name: 'cedar-14'},
          web_url: 'https://foobar.com',
        })

      await runCommand(CreateCommand, ['--no-remote'])

      expect(configureCredentialHelperStub.called).to.be.false
    })
  })
})
