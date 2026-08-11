import {APIClient} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {appExtensions} from '@heroku/sdk/extensions/platform'
import {expect} from 'chai'
import nock from 'nock'
import {execSync} from 'node:child_process'
import * as sinon from 'sinon'
import {SinonStub, stub} from 'sinon'

import CreateCommand from '../../../../src/commands/apps/create.js'
import Git from '../../../../src/lib/git/git.js'

type FakePlatform = {
  app: {createAndSetup: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    app: {createAndSetup: sinon.stub()},
  }
}

describe('apps:create', function () {
  let fakePlatform: FakePlatform
  let api: nock.Scope
  let configureCredentialHelperStub: SinonStub
  let gitCreateRemoteStub: SinonStub
  let platformGetterStub: SinonStub

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    platformGetterStub = sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform) as unknown as SinonStub

    api = nock('https://api.heroku.com')

    configureCredentialHelperStub = stub(Git.prototype, 'configureCredentialHelper').resolves()
    gitCreateRemoteStub = stub(Git.prototype, 'createRemote').resolves()
  })

  afterEach(function () {
    sinon.restore()

    api.done()
    nock.cleanAll()

    configureCredentialHelperStub.restore()
    gitCreateRemoteStub.restore()

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
    fakePlatform.app.createAndSetup.resolves({
      name: 'foobar',
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    })

    const {stderr, stdout} = await runCommand(CreateCommand, [])

    expect(stderr).to.contain('Creating app... done, ⬢ foobar')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    expect(fakePlatform.app.createAndSetup.calledOnce).to.equal(true)

    const input = fakePlatform.app.createAndSetup.firstCall.args[0]
    expect(input.addons).to.equal(undefined)
    expect(input.buildpack).to.equal(undefined)
  })

  it('resolves run() to the created app on the flags path', async function () {
    const app = {
      name: 'foobar',
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    }
    fakePlatform.app.createAndSetup.resolves(app)

    const {result} = await runCommand(CreateCommand, [])

    expect(result).to.deep.equal(app)
  })

  it('creates an app with feature flags', async function () {
    fakePlatform.app.createAndSetup.resolves({
      name: 'foobar',
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    })

    const {stderr, stdout} = await runCommand(CreateCommand, ['--features', 'feature-1,feature-2'])

    expect(stderr).to.contain('Creating app... done, ⬢ foobar')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    expect(fakePlatform.app.createAndSetup.calledOnce).to.equal(true)
    expect(fakePlatform.app.createAndSetup.calledWith(sinon.match({feature_flags: 'feature-1,feature-2'}))).to.equal(true)
  })

  it('threads kernel and locked pass-through flags to createAndSetup', async function () {
    fakePlatform.app.createAndSetup.resolves({
      name: 'foobar',
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    })

    const {stderr, stdout} = await runCommand(CreateCommand, ['--kernel', 'my-kernel', '--locked'])

    expect(stderr).to.contain('Creating app... done, ⬢ foobar')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    expect(fakePlatform.app.createAndSetup.calledOnce).to.equal(true)
    expect(fakePlatform.app.createAndSetup.calledWith(sinon.match({kernel: 'my-kernel', locked: true}))).to.equal(true)
  })

  it('creates an app in a space', async function () {
    fakePlatform.app.createAndSetup.resolves({
      name: 'foobar',
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    })

    const {stderr, stdout} = await runCommand(CreateCommand, ['--space', 'my-space-name'])

    expect(stderr).to.contain('Creating app in space my-space-name... done, ⬢ foobar')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    expect(fakePlatform.app.createAndSetup.calledOnce).to.equal(true)
    expect(fakePlatform.app.createAndSetup.calledWith(sinon.match({space: 'my-space-name'}))).to.equal(true)
  })

  it('creates an Internal Web App in a space', async function () {
    fakePlatform.app.createAndSetup.resolves({
      internal_routing: true,
      name: 'foobar',
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    })

    const {stderr, stdout} = await runCommand(CreateCommand, ['--space', 'my-space-name', '--internal-routing'])

    expect(stderr).to.contain('Creating app in space my-space-name... done, ⬢ foobar')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    expect(fakePlatform.app.createAndSetup.calledOnce).to.equal(true)
    expect(fakePlatform.app.createAndSetup.calledWith(sinon.match({
      internal_routing: true,
      space: 'my-space-name',
    }))).to.equal(true)
  })

  it('does not create an Internal Web App outside of a space', async function () {
    const {error} = await runCommand(CreateCommand, ['--internal-routing'])

    expect(error).to.be.an.instanceof(Error)
    expect(error?.message).to.equal('Space name required.\nInternal Web Apps are only available for Private Spaces.\nUSAGE: heroku apps:create --space my-space --internal-routing')
    expect(fakePlatform.app.createAndSetup.called).to.equal(false)
  })

  it('creates an app & returns as json', async function () {
    const json = {
      name: 'foobar',
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    }

    fakePlatform.app.createAndSetup.resolves(json)

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

    it('passes manifest addons and config vars to createAndSetup', async function () {
      fakePlatform.app.createAndSetup.resolves({
        name: appName,
        stack: {name: 'container'},
        web_url: 'https://foobar.com',
      })

      // Override channel using environment variable for this test
      process.env.HEROKU_UPDATE_CHANNEL = 'beta'

      const {stderr, stdout} = await runCommand(CreateCommand, ['--app', appName, '--manifest'])

      expect(stderr).to.contain('Reading heroku.yml manifest... done')
      expect(stderr).to.contain('Creating ⬢ foo... done')
      expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foo.git\n')
      expect(fakePlatform.app.createAndSetup.calledOnce).to.equal(true)
      expect(fakePlatform.app.createAndSetup.calledWith(sinon.match({
        addons: sinon.match.array.deepEquals([{as: 'DATABASE', plan: 'heroku-postgresql'}]),
        configVars: sinon.match({S3_BUCKET: 'my-example-bucket'}),
        name: 'foo',
        stack: 'container',
      }))).to.equal(true)

      delete process.env.HEROKU_UPDATE_CHANNEL
    })
  })

  describe('apps:create with buildpack & addon flags', function () {
    const appName = 'foo'
    const addon = 'foobar, secondPlan'

    it('threads addons through to createAndSetup when addons flag is present', async function () {
      fakePlatform.app.createAndSetup.resolves({
        name: appName,
        stack: {name: 'cedar-14'},
        web_url: 'https://foobar.com',
      })

      const {stderr, stdout} = await runCommand(CreateCommand, ['--app', appName, '--addons', addon])

      expect(stderr).to.contain('Creating ⬢ foo... done')
      expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foo.git\n')
      expect(fakePlatform.app.createAndSetup.calledOnce).to.equal(true)
      expect(fakePlatform.app.createAndSetup.calledWith(sinon.match({
        addons: sinon.match.array.deepEquals([{plan: 'foobar'}, {plan: 'secondPlan'}]),
      }))).to.equal(true)
    })

    it('threads buildpack through to createAndSetup when buildpack flag is present', async function () {
      const exampleBuildpack = 'https://github.com/some/buildpack.git'

      fakePlatform.app.createAndSetup.resolves({
        name: appName,
        stack: {name: 'cedar-14'},
        web_url: 'https://foobar.com',
      })

      const {stderr, stdout} = await runCommand(CreateCommand, ['--app', appName, '--addons', addon, '--buildpack', exampleBuildpack])

      expect(stderr).to.contain('Creating ⬢ foo... done')
      expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foo.git\n')
      expect(fakePlatform.app.createAndSetup.calledOnce).to.equal(true)
      expect(fakePlatform.app.createAndSetup.calledWith(sinon.match({
        addons: sinon.match.array.deepEquals([{plan: 'foobar'}, {plan: 'secondPlan'}]),
        buildpack: exampleBuildpack,
      }))).to.equal(true)
    })
  })

  it('creates an app in the region', async function () {
    fakePlatform.app.createAndSetup.resolves({
      name: 'foobar',
      region: {name: 'eu'},
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    })

    const {stderr, stdout} = await runCommand(CreateCommand, ['--region', 'eu'])

    expect(stderr).to.contain('Creating app... done, ⬢ foobar, region is eu')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    expect(fakePlatform.app.createAndSetup.calledWith(sinon.match({region: 'eu'}))).to.equal(true)
  })

  it('creates an with stack', async function () {
    fakePlatform.app.createAndSetup.resolves({
      name: 'foobar',
      stack: {name: 'test'},
      web_url: 'https://foobar.com',
    })

    const {stderr, stdout} = await runCommand(CreateCommand, ['--stack', 'test'])

    expect(stderr).to.contain('Creating app... done, ⬢ foobar, stack is test')
    expect(stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n')
    expect(fakePlatform.app.createAndSetup.calledWith(sinon.match({stack: 'test'}))).to.equal(true)
  })

  it('threads the CLI auth token into the SDK client options', async function () {
    // Opt out of the shared platform getter stub so the real SDK + platform
    // client run and actually issue an HTTP request. The CLI resolves the
    // token into `this.heroku.auth` during Command.init(); the command must
    // forward it as `clientOptions.token`, which heroku-fetch turns into the
    // outgoing `Authorization: Bearer <token>` header. Pin `this.heroku.auth`
    // to a sentinel distinct from the test env's HEROKU_API_KEY so this test
    // fails if the command drops `clientOptions: {token: this.heroku.auth}`
    // (the SDK would then fall back to the env token, flipping the header).
    platformGetterStub.restore()
    sinon.stub(APIClient.prototype, 'auth').get(() => 'cli-keychain-token')

    let authHeader: string | undefined
    api
      .post('/apps')
      .reply(function () {
        authHeader = this.req.headers.authorization as unknown as string
        return [201, {name: 'foobar', stack: {name: 'cedar-14'}, web_url: 'https://foobar.com'}]
      })

    await runCommand(CreateCommand, ['--no-remote'])

    expect(authHeader).to.equal('Bearer cli-keychain-token')
  })

  it('wires appExtensions into the real SDK so createAndSetup is invoked', async function () {
    // Opt out of the shared HerokuSDK.prototype.platform getter stub for this
    // test so the real `mergeExtensions` runs against the constructed SDK.
    // Instead of faking the whole platform, stub the extension bundle's factory
    // (the same `appExtensions` specifier create.ts imports). If create.ts ever
    // stops passing `{extensions: [appExtensions]}` to `new HerokuSDK(...)`, the
    // factory is never invoked, createAndSetup is never wired in, and this test
    // fails.
    platformGetterStub.restore()

    const createAndSetupStub = sinon.stub().resolves({
      name: 'foobar',
      stack: {name: 'cedar-14'},
      web_url: 'https://foobar.com',
    })
    sinon.stub(appExtensions, 'factory').returns({createAndSetup: createAndSetupStub} as never)

    await runCommand(CreateCommand, [])

    expect(createAndSetupStub.calledOnce).to.equal(true)
  })

  describe('git operations', function () {
    beforeEach(function () {
      fakePlatform.app.createAndSetup.resolves({
        name: 'foobar',
        stack: {name: 'cedar-14'},
        web_url: 'https://foobar.com',
      })
    })

    it('creates a remote when in a git repository and --no-remote is not used', async function () {
      await runCommand(CreateCommand, [])

      expect(gitCreateRemoteStub.calledOnce).to.be.true
    })

    it('does not create a remote when not in a git repository', async function () {
      const inGitRepoStub = stub(Git.prototype, 'inGitRepo').returns(false)

      try {
        await runCommand(CreateCommand, [])
        expect(gitCreateRemoteStub.called).to.be.false
      } finally {
        inGitRepoStub.restore()
      }
    })

    it('does not create a remote when --no-remote is used', async function () {
      await runCommand(CreateCommand, ['--no-remote'])

      expect(gitCreateRemoteStub.called).to.be.false
    })

    it('configures git credential helper when creating a remote', async function () {
      await runCommand(CreateCommand, [])

      expect(configureCredentialHelperStub.calledOnce).to.be.true
    })

    it('does not configure git credential helper when --no-remote is used', async function () {
      await runCommand(CreateCommand, ['--no-remote'])

      expect(configureCredentialHelperStub.called).to.be.false
    })
  })
})
