import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'

import AppsDiff from '../../../../src/commands/apps/diff.js'

type FakePlatform = {
  addOn: {listByApp: sinon.SinonStub}
  app: {info: sinon.SinonStub}
  appFeature: {list: sinon.SinonStub}
  buildpackInstallation: {list: sinon.SinonStub}
  configVar: {infoForApp: sinon.SinonStub}
  release: {list: sinon.SinonStub}
  slug: {info: sinon.SinonStub}
  withHeaders: sinon.SinonStub
}

describe('apps:diff', function () {
  const app1Name = 'myapp-one'
  const app2Name = 'myapp-two'
  const slugId1 = 'slug-id-1'
  const slugId2 = 'slug-id-2'
  const sameChecksum = 'SHA256:same-checksum-for-both-apps'
  const releasesWithSlug = (slugId: string) => [{slug: {id: slugId}, status: 'succeeded'}]
  const slugBody = (checksum: string) => ({checksum, id: 'slug-1'})
  const appStack = (stackName: string) => ({id: 'app-id', name: 'myapp', stack: {name: stackName}})
  const emptyBuildpacks: Array<{buildpack: {url: string}}> = []
  const emptyAddons: Array<{addon_service: {name: string}}> = []
  const emptyFeatures: Array<{enabled: boolean; name: string;}> = []

  let fakePlatform: FakePlatform

  function buildFakePlatform(): FakePlatform {
    const fake = {
      addOn: {listByApp: sinon.stub()},
      app: {info: sinon.stub()},
      appFeature: {list: sinon.stub()},
      buildpackInstallation: {list: sinon.stub()},
      configVar: {infoForApp: sinon.stub()},
      release: {list: sinon.stub()},
      slug: {info: sinon.stub()},
      withHeaders: sinon.stub(),
    }
    // checksum() calls platform.withHeaders({Range}).release.list(app); the scoped
    // client exposes the same resources, so self-return keeps a single release.list
    // stub to assert against.
    fake.withHeaders.returns(fake)
    return fake
  }

  function httpStatusError(statusCode: number): Error & {http: {statusCode: number}} {
    const e = new Error(`HTTP ${statusCode}`) as Error & {http: {statusCode: number}}
    e.http = {statusCode}
    return e
  }

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('prints table with no diff rows when both apps are identical', async function () {
    fakePlatform.release.list.callsFake(async (app: string) => releasesWithSlug(app === app1Name ? slugId1 : slugId2))
    fakePlatform.slug.info.resolves(slugBody(sameChecksum))
    fakePlatform.configVar.infoForApp.resolves({})
    fakePlatform.buildpackInstallation.list.resolves(emptyBuildpacks)
    fakePlatform.addOn.listByApp.resolves(emptyAddons)
    fakePlatform.appFeature.list.resolves(emptyFeatures)
    fakePlatform.app.info.callsFake(async () => appStack('heroku-22'))

    const {error, stdout} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('property')
    expect(stdout).to.include(app1Name)
    expect(stdout).to.include(app2Name)
    expect(stdout.trim()).to.not.include('slug (checksum)')
  })

  it('includes slug (checksum) row when checksums differ', async function () {
    const checksum1 = 'SHA256:aaaaaaaa'
    const checksum2 = 'SHA256:bbbbbbbb'

    fakePlatform.release.list.callsFake(async (app: string) => releasesWithSlug(app === app1Name ? slugId1 : slugId2))
    fakePlatform.slug.info.callsFake(async (app: string) => slugBody(app === app1Name ? checksum1 : checksum2))
    fakePlatform.configVar.infoForApp.resolves({})
    fakePlatform.buildpackInstallation.list.resolves(emptyBuildpacks)
    fakePlatform.addOn.listByApp.resolves(emptyAddons)
    fakePlatform.appFeature.list.resolves(emptyFeatures)
    fakePlatform.app.info.callsFake(async () => appStack('heroku-22'))

    const {error, stdout} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('slug (checksum)')
    expect(stdout).to.include('SHA256:aaaaaaaa')
    expect(stdout).to.include('SHA256:bbbbbbbb')
    // Pin the Range opt-out: the releases lookup MUST go through
    // withHeaders({Range}) so the SDK dispatcher skips auto-pagination and
    // returns only the latest release. Without this, a regression to a bare
    // release.list(app) would still pass every other assertion while silently
    // re-enabling pagination in prod.
    expect(fakePlatform.withHeaders.calledWith({Range: 'version ..; max=1, order=desc'})).to.equal(true)
  })

  it('includes config and stack diff rows when they differ', async function () {
    fakePlatform.release.list.callsFake(async (app: string) => releasesWithSlug(app === app1Name ? slugId1 : slugId2))
    fakePlatform.slug.info.resolves(slugBody(sameChecksum))
    fakePlatform.configVar.infoForApp.callsFake(async (app: string) => (app === app1Name
      ? {BAR: 'same', FOO: 'a'}
      : {BAR: 'same', FOO: 'b'}))
    fakePlatform.buildpackInstallation.list.resolves(emptyBuildpacks)
    fakePlatform.addOn.listByApp.resolves(emptyAddons)
    fakePlatform.appFeature.list.resolves(emptyFeatures)
    fakePlatform.app.info.callsFake(async (app: string) => appStack(app === app1Name ? 'heroku-22' : 'heroku-24'))

    const {error, stdout} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('config (FOO)')
    expect(stdout).to.include('stack')
    expect(stdout).to.include('heroku-22')
    expect(stdout).to.include('heroku-24')
  })

  it('throws App not found when one app returns 404 on releases', async function () {
    fakePlatform.release.list.callsFake(async (app: string) => {
      if (app === app1Name) {
        throw httpStatusError(404)
      }

      return releasesWithSlug(slugId2)
    })
    fakePlatform.slug.info.resolves(slugBody(sameChecksum))

    const {error} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.not.be.undefined
    expect(error!.message).to.include('App not found')
    expect(error!.message).to.include(app1Name)
  })

  it('throws App not found when slug returns 404', async function () {
    fakePlatform.release.list.callsFake(async (app: string) => releasesWithSlug(app === app1Name ? slugId1 : slugId2))
    fakePlatform.slug.info.callsFake(async (app: string) => {
      if (app === app1Name) {
        throw httpStatusError(404)
      }

      return slugBody(sameChecksum)
    })

    const {error} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.not.be.undefined
    expect(error!.message).to.include('App not found')
    expect(error!.message).to.include(app1Name)
  })

  it('truncates long values to 56 chars with ellipsis', async function () {
    const longChecksum = 'SHA256:' + 'a'.repeat(60)

    fakePlatform.release.list.callsFake(async (app: string) => releasesWithSlug(app === app1Name ? slugId1 : slugId2))
    fakePlatform.slug.info.callsFake(async (app: string) => slugBody(app === app1Name ? longChecksum : sameChecksum))
    fakePlatform.configVar.infoForApp.resolves({})
    fakePlatform.buildpackInstallation.list.resolves(emptyBuildpacks)
    fakePlatform.addOn.listByApp.resolves(emptyAddons)
    fakePlatform.appFeature.list.resolves(emptyFeatures)
    fakePlatform.app.info.callsFake(async () => appStack('heroku-22'))

    const {error, stdout} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('slug (checksum)')
    expect(stdout).to.match(/\.\.\./)
    expect(stdout).to.include('SHA256:')
  })

  it('shows add-on only on second app', async function () {
    const addons2 = [{addon_service: {name: 'heroku-postgresql'}}]

    fakePlatform.release.list.callsFake(async (app: string) => releasesWithSlug(app === app1Name ? slugId1 : slugId2))
    fakePlatform.slug.info.resolves(slugBody(sameChecksum))
    fakePlatform.configVar.infoForApp.resolves({})
    fakePlatform.buildpackInstallation.list.resolves(emptyBuildpacks)
    fakePlatform.addOn.listByApp.callsFake(async (app: string) => (app === app1Name ? emptyAddons : addons2))
    fakePlatform.appFeature.list.resolves(emptyFeatures)
    fakePlatform.app.info.callsFake(async () => appStack('heroku-22'))

    const {error, stdout} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('add-on (heroku-postgresql)')
    expect(stdout).to.include('false')
    expect(stdout).to.include('true')
  })

  it('shows no slug row when both apps have no release slug', async function () {
    const releasesNoSlug = [{status: 'succeeded'}]

    fakePlatform.release.list.resolves(releasesNoSlug)
    // No release slug means slug.info is never reached.
    fakePlatform.slug.info.callsFake(async () => {
      throw new Error('unexpected slug info call')
    })
    fakePlatform.configVar.infoForApp.resolves({})
    fakePlatform.buildpackInstallation.list.resolves(emptyBuildpacks)
    fakePlatform.addOn.listByApp.resolves(emptyAddons)
    fakePlatform.appFeature.list.resolves(emptyFeatures)
    fakePlatform.app.info.callsFake(async () => appStack('heroku-22'))

    const {error, stdout} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('property')
    expect(stdout.trim()).to.not.include('slug (checksum)')
  })
})
