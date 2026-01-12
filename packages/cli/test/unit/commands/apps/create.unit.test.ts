import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import {stderr, stdout} from 'stdout-stderr'

import CreateCommand from '../../../../src/commands/apps/create.js'
import runCommandHelper from '../../../helpers/runCommand.js'

describe('apps:create', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('creates an app', async function () {
    api
      .post('/apps', {})
      .reply(200, {
        name: 'foobar',
        stack: {name: 'cedar-14'},
        web_url: 'https://foobar.com',
      })

    const {stderr, stdout} = await runCommand(['apps:create'])

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

    const {stderr, stdout} = await runCommand(['apps:create', '--features', 'feature-1,feature-2'])

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

    const {stderr, stdout} = await runCommand(['apps:create', '--space', 'my-space-name'])

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

    const {stderr, stdout} = await runCommand(['apps:create', '--space', 'my-space-name', '--internal-routing'])

    expect(stderr).to.contain('Creating app in space my-space-name... done, ⬢ foobar')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
  })

  it('does not create an Internal Web App outside of a space', async function () {
    const {error} = await runCommand(['apps:create', '--internal-routing'])

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

    const {stderr, stdout} = await runCommand(['apps:create', '--json'])

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

      await runCommandHelper(CreateCommand, ['--app', appName, '--manifest'])

      expect(stderr.output).to.contain('Reading heroku.yml manifest... done')
      expect(stderr.output).to.contain('Creating ⬢ foo... done')
      expect(stderr.output).to.contain('Adding heroku-postgresql... done')
      expect(stderr.output).to.contain('Setting config vars... done')
      expect(stdout.output).to.equal('https://foobar.com | https://git.heroku.com/foo.git\n')

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

      await runCommandHelper(CreateCommand, ['--app', appName, '--addons', addon])

      expect(stderr.output).to.contain('Creating ⬢ foo... done')
      expect(stderr.output).to.contain('Adding foobar... done')
      expect(stderr.output).to.contain('Adding secondPlan... done')
      expect(stdout.output).to.equal('https://foobar.com | https://git.heroku.com/foo.git\n')
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

      await runCommandHelper(CreateCommand, ['--app', appName, '--addons', addon, '--buildpack', exampleBuildpack])

      expect(stderr.output).to.contain('Creating ⬢ foo... done')
      expect(stderr.output).to.contain('Adding foobar... done')
      expect(stderr.output).to.contain('Adding secondPlan... done')
      expect(stderr.output).to.contain('Setting buildpack to https://github.com/some/buildpack.git')
      expect(stdout.output).to.equal('https://foobar.com | https://git.heroku.com/foo.git\n')
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

    const {stderr, stdout} = await runCommand(['apps:create', '--region', 'eu'])

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

    const {stderr, stdout} = await runCommand(['apps:create', '--stack', 'test'])

    expect(stderr).to.contain('Creating app... done, ⬢ foobar, stack is test')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
  })
})
