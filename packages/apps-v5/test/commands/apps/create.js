'use strict'
/* globals beforeEach commands */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('chai').expect
const apps = commands.find(c => c.topic === 'apps' && c.command === 'create')
const {Config} = require('@oclif/core')
const yaml = require('js-yaml')
const fse = require('fs-extra')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
let config

describe('apps:create', function () {
  beforeEach(async () => {
    config = await Config.load()
    config.channel = 'beta'
    cli.mockConsole()
    nock.cleanAll()
  })

  it('is configured for an optional team flag', function () {
    expect(apps).to.have.own.property('wantsOrg', true)
  })

  it('creates an app', function () {
    let mock = nock('https://api.heroku.com')
    .post('/apps', {})
    .reply(200, {
      name: 'foobar',
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    })

    return apps.run({flags: {}, args: {}, httpGitHost: 'git.heroku.com', config}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('Creating app... done, foobar\n')
      expect(cli.stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    })
  })

  it('creates an app with feature flags', function () {
    let mock = nock('https://api.heroku.com')
    .post('/apps', {
      feature_flags: 'feature-1,feature-2',
    })
    .reply(200, {
      name: 'foobar',
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    })

    return apps.run({flags: {features: 'feature-1,feature-2'}, args: {}, httpGitHost: 'git.heroku.com', config}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('Creating app... done, foobar\n')
      expect(cli.stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    })
  })

  it('creates an app in a space', function () {
    let mock = nock('https://api.heroku.com')
    .post('/teams/apps', {
      space: 'my-space-name',
    })
    .reply(200, {
      name: 'foobar',
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    })

    return apps.run({flags: {space: 'my-space-name'}, args: {}, httpGitHost: 'git.heroku.com', config}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('Creating app in space my-space-name... done, foobar\n')
      expect(cli.stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    })
  })

  it('creates an Internal Web App in a space', function () {
    let mock = nock('https://api.heroku.com')
    .post('/teams/apps', {
      space: 'my-space-name',
      internal_routing: true,
    })
    .reply(200, {
      name: 'foobar',
      stack: {name: 'cedar-14'},
      internal_routing: true,
      web_url: 'https://foobar.com',
    })

    return apps.run({flags: {space: 'my-space-name', 'internal-routing': true}, args: {}, httpGitHost: 'git.heroku.com', config}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('Creating app in space my-space-name... done, foobar\n')
      expect(cli.stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    })
  })

  it('does not create an Internal Web App outside of a space', function () {
    let thrown = false
    return apps.run({flags: {'internal-routing': true}, args: {}, httpGitHost: 'git.heroku.com', config})
    .catch(function (error) {
      expect(error).to.be.an.instanceof(Error)
      expect(error.message).to.equal('Space name required.\nInternal Web Apps are only available for Private Spaces.\nUSAGE: heroku apps:create --space my-space --internal-routing')
      thrown = true
    })
    .then(() => expect(thrown).to.equal(true))
  })

  it('creates an app & returns as json', function () {
    const json = {
      name: 'foobar',
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    }
    let mock = nock('https://api.heroku.com')
    .post('/apps', {})
    .reply(200, json)

    return apps.run({flags: {json: true}, args: {}, httpGitHost: 'git.heroku.com', config}).then(function () {
      mock.done()

      expect(cli.stderr).to.equal('Creating app... done, foobar\n')
      expect(JSON.parse(cli.stdout), 'to satisfy', json)
    })
  })

  describe('testing manifest flag', function () {
    let cmd
    let readFileStub
    let safeLoadStub

    const manifest = {
      setup: {addons: [{plan: 'heroku-postgresql', as: 'DATABASE'}], config: {S3_BUCKET: 'my-example-bucket'}},
      build: {
        docker: {web: 'Dockerfile', worker: 'worker/Dockerfile'},
        config: {RAILS_ENV: 'development', FOO: 'bar'},
      },
      release: {command: ['./deployment-tasks.sh'], image: 'worker'},
      run: {
        web: 'bundle exec puma -C config/puma.rb',
        worker: 'python myworker.py',
        'asset-syncer': {command: ['python asset-syncer.py'], image: 'worker'},
      },
    }

    beforeEach(async () => {
      readFileStub = sinon.stub(fse, 'readFile').returns('')
      safeLoadStub = sinon.stub(yaml, 'safeLoad').returns(manifest)

      cmd = proxyquire('../../../src/commands/apps/create', {
        'js-yaml': safeLoadStub,
        'fs-extra': readFileStub,
      })
    })

    this.afterEach(() => {
      readFileStub.restore()
      safeLoadStub.restore()
    })

    it('sets config vars when manifest flag is present', function () {
      const appName = 'foo'

      let mock = nock('https://api.heroku.com')
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

      return cmd[0].run({flags: {app: appName, manifest: true}, args: {}, config}).then(function () {
        mock.done()

        expect(mock.isDone()).to.equal(true)
      })
    })
  })

  describe('apps:create with buildpack & addon flags', function () {
    beforeEach(async () => {
      config = await Config.load()
      config.channel = 'alpha'
      cli.mockConsole()
      nock.cleanAll()
    })

    it('adds addon if addons flag is present', function () {
      const appName = 'foo'
      const addon = 'foobar, secondPlan'

      let mock = nock('https://api.heroku.com')
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

      return apps.run({flags: {app: appName, addons: addon}, args: {}, config}).then(function () {
        mock.done()

        expect(mock.isDone()).to.equal(true)
      })
    })

    it('sets buildpack if buildpack flag is present', function () {
      const appName = 'foo'
      const addon = 'foobar, secondPlan'
      const exampleBuildpack = 'https://github.com/some/buildpack.git'

      let mock = nock('https://api.heroku.com')
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

      return apps.run({flags: {app: appName, addons: addon, buildpack: exampleBuildpack}, args: {}, config}).then(function () {
        mock.done()

        expect(mock.isDone()).to.equal(true)
      })
    })
  })
})
