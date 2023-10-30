import {test, expect} from '@oclif/test'
import * as yaml from 'js-yaml'
import * as fse from 'fs-extra'
import * as sinon from 'sinon'
import * as proxyquire from 'proxyquire'

describe('apps:create', async function () {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => {
      api.post('/apps', {})
        .reply(200, {
          name: 'foobar',
          stack: {name: 'cedar-14'},
          web_url: 'https://foobar.com',
        })
    })
    .command(['apps:create'])
    .it('creates an app', ({stderr, stdout}) => {
      expect(stderr).to.contain('Creating app... done, ⬢ foobar')
      expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => {
      api
        .post('/apps', {feature_flags: 'feature-1,feature-2'})
        .reply(200, {
          name: 'foobar',
          stack: {name: 'cedar-14'},
          web_url: 'https://foobar.com',
        })
    })
    .command(['apps:create', '--features', 'feature-1,feature-2'])
    .it('creates an app with feature flags', ({stderr, stdout}) => {
      expect(stderr).to.contain('Creating app... done, ⬢ foobar')
      expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => {
      api
        .post('/teams/apps', {
          space: 'my-space-name',
        })
        .reply(200, {
          name: 'foobar',
          stack: {name: 'cedar-14'},
          web_url: 'https://foobar.com',
        })
    })
    .command(['apps:create', '--space', 'my-space-name'])
    .it('creates an app in a space', ({stderr, stdout}) => {
      expect(stderr).to.contain('Creating app in space my-space-name... done, ⬢ foobar')
      expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => {
      api
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
    })
    .command(['apps:create', '--space', 'my-space-name', '--internal-routing'])
    .it('creates an Internal Web App in a space', ({stderr, stdout}) => {
      expect(stderr).to.contain('Creating app in space my-space-name... done, ⬢ foobar')
      expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    })

  let thrown = false
  test
    .stdout()
    .stderr()
    .command(['apps:create', '--internal-routing'])
    .catch((error: any) => {
      expect(error).to.be.an.instanceof(Error)
      expect(error.message).to.equal('Space name required.\nInternal Web Apps are only available for Private Spaces.\nUSAGE: heroku apps:create --space my-space --internal-routing')
      thrown = true
    })
    .it('does not create an Internal Web App outside of a space', () => {
      expect(thrown).to.equal(true)
    })

  const json = {
    name: 'foobar',
    stack: {name: 'cedar-14'},
    web_url: 'https://foobar.com',
  }

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => {
      api
        .post('/apps', {})
        .reply(200, json)
    })
    .command(['apps:create', '--json'])
    .it('creates an app & returns as json', ({stderr, stdout}) => {
      expect(stderr).to.contain('Creating app... done, ⬢ foobar')
      expect(JSON.parse(stdout)).to.deep.equal(json)
    })

  describe('testing manifest flag', async () => {
    const appName = 'foo'

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

    let readFileStub: ReturnType<typeof sinon.stub>
    let safeLoadStub: ReturnType<typeof sinon.stub>

    beforeEach(async () => {
      readFileStub = sinon.stub(fse, 'readFile').returns(Promise.resolve((Buffer.from(''))))
      safeLoadStub = sinon.stub(yaml, 'load').returns(manifest)

      proxyquire('../../../../src/commands/apps/create', {
        'js-yaml': safeLoadStub,
        'fs-extra': readFileStub,
      })
    })

    afterEach(() => {
      readFileStub.restore()
      safeLoadStub.restore()
    })

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com', api => {
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
      })
      .loadConfig() // add `config` to context
      .do(({config}) => {
        // override channel for logic in command
        config.channel = 'beta'
      })
      .command(['apps:create', '--app', appName, '--manifest'])
      .it('sets config vars when manifest flag is present', ({stderr, stdout}) => {
        expect(stderr).to.contain('Reading heroku.yml manifest... done')
        expect(stderr).to.contain('Creating ⬢ foo... done')
        expect(stderr).to.contain('Adding heroku-postgresql... done')
        expect(stderr).to.contain('Setting config vars... done')
        expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foo.git\n')
      })
  })

  describe('apps:create with buildpack & addon flags', function () {
    const appName = 'foo'
    const addon = 'foobar, secondPlan'

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com', api => {
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
      })
      .command(['apps:create', '--app', appName, '--addons', addon])
      .it('adds addon if addons flag is present', ({stderr, stdout}) => {
        expect(stderr).to.contain('Creating ⬢ foo... done')
        expect(stderr).to.contain('Adding foobar... done')
        expect(stderr).to.contain('Adding secondPlan... done')
        expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foo.git\n')
      })

    const exampleBuildpack = 'https://github.com/some/buildpack.git'

    test
      .stdout()
      .stderr()
      .nock('https://api.heroku.com', api => {
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
      })
      .command(['apps:create', '--app', appName, '--addons', addon, '--buildpack', exampleBuildpack])
      .it('sets buildpack if buildpack flag is present', ({stderr, stdout}) => {
        expect(stderr).to.contain('Creating ⬢ foo... done')
        expect(stderr).to.contain('Adding foobar... done')
        expect(stderr).to.contain('Adding secondPlan... done')
        expect(stderr).to.contain('Setting buildpack to https://github.com/some/buildpack.git... done')
        expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foo.git\n')
      })
  })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => {
      api.post('/apps', {region: 'eu'})
        .reply(200, {
          name: 'foobar',
          stack: {name: 'cedar-14'},
          web_url: 'https://foobar.com',
          region: {name: 'eu'},
        })
    })
    .command(['apps:create', '--region', 'eu'])
    .it('creates an app in the region', ({stderr, stdout}) => {
      expect(stderr).to.contain('Creating app... done, ⬢ foobar, region is eu')
      expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    })

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => {
      api.post('/apps', {stack: 'test'})
        .reply(200, {
          name: 'foobar',
          stack: {name: 'test'},
          web_url: 'https://foobar.com',
        })
    })
    .command(['apps:create', '--stack', 'test'])
    .it('creates an with stack', ({stderr, stdout}) => {
      expect(stderr).to.contain('Creating app... done, ⬢ foobar, stack is test')
      expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    })
})

