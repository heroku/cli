import {APIClient} from '@heroku-cli/command'
import {expect} from 'chai'
import sinon from 'sinon'

import AppsDiff from '../../../../src/commands/apps/diff.js'
import {runCommand} from '../../../helpers/run-command.js'

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

  let sandbox: sinon.SinonSandbox
  let requestStub: sinon.SinonStub
  let getStub: sinon.SinonStub

  function httpStatusError(statusCode: number): Error & {http: {statusCode: number}} {
    const e = new Error(`HTTP ${statusCode}`) as Error & {http: {statusCode: number}}
    e.http = {statusCode}
    return e
  }

  beforeEach(function () {
    sandbox = sinon.createSandbox()
    requestStub = sandbox.stub(APIClient.prototype, 'request')
    getStub = sandbox.stub(APIClient.prototype, 'get')
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('prints table with no diff rows when both apps are identical', async function () {
    requestStub.callsFake(async (url: string) => {
      if (!url.includes('/releases')) {
        throw new Error(`unexpected request ${url}`)
      }

      const slugId = url.includes(app1Name) ? slugId1 : slugId2
      return {body: releasesWithSlug(slugId)}
    })

    getStub.callsFake(async (url: string) => {
      if (url.includes('/slugs/')) {
        return {body: slugBody(sameChecksum)}
      }

      if (url.includes('/config-vars')) {
        return {body: {}}
      }

      if (url.includes('/buildpack-installations')) {
        return {body: emptyBuildpacks}
      }

      if (url.includes('/addons')) {
        return {body: emptyAddons}
      }

      if (url.includes('/features')) {
        return {body: emptyFeatures}
      }

      if (new RegExp(`/apps/${app1Name}$`).test(url)) {
        return {body: appStack('heroku-22')}
      }

      if (new RegExp(`/apps/${app2Name}$`).test(url)) {
        return {body: appStack('heroku-22')}
      }

      throw new Error(`unexpected GET ${url}`)
    })

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

    requestStub.callsFake(async (url: string) => {
      if (!url.includes('/releases')) {
        throw new Error(`unexpected request ${url}`)
      }

      const slugId = url.includes(app1Name) ? slugId1 : slugId2
      return {body: releasesWithSlug(slugId)}
    })

    getStub.callsFake(async (url: string) => {
      if (url.includes('/slugs/')) {
        const checksum = url.includes(app1Name) ? checksum1 : checksum2
        return {body: slugBody(checksum)}
      }

      if (url.includes('/config-vars')) {
        return {body: {}}
      }

      if (url.includes('/buildpack-installations')) {
        return {body: emptyBuildpacks}
      }

      if (url.includes('/addons')) {
        return {body: emptyAddons}
      }

      if (url.includes('/features')) {
        return {body: emptyFeatures}
      }

      if (new RegExp(`/apps/${app1Name}$`).test(url)) {
        return {body: appStack('heroku-22')}
      }

      if (new RegExp(`/apps/${app2Name}$`).test(url)) {
        return {body: appStack('heroku-22')}
      }

      throw new Error(`unexpected GET ${url}`)
    })

    const {error, stdout} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('slug (checksum)')
    expect(stdout).to.include('SHA256:aaaaaaaa')
    expect(stdout).to.include('SHA256:bbbbbbbb')
  })

  it('includes config and stack diff rows when they differ', async function () {
    requestStub.callsFake(async (url: string) => {
      if (!url.includes('/releases')) {
        throw new Error(`unexpected request ${url}`)
      }

      const slugId = url.includes(app1Name) ? slugId1 : slugId2
      return {body: releasesWithSlug(slugId)}
    })

    getStub.callsFake(async (url: string) => {
      if (url.includes('/slugs/')) {
        return {body: slugBody(sameChecksum)}
      }

      if (url.includes('/config-vars')) {
        return {
          body: url.includes(app1Name)
            ? {BAR: 'same', FOO: 'a'}
            : {BAR: 'same', FOO: 'b'},
        }
      }

      if (url.includes('/buildpack-installations')) {
        return {body: emptyBuildpacks}
      }

      if (url.includes('/addons')) {
        return {body: emptyAddons}
      }

      if (url.includes('/features')) {
        return {body: emptyFeatures}
      }

      if (new RegExp(`/apps/${app1Name}$`).test(url)) {
        return {body: appStack('heroku-22')}
      }

      if (new RegExp(`/apps/${app2Name}$`).test(url)) {
        return {body: appStack('heroku-24')}
      }

      throw new Error(`unexpected GET ${url}`)
    })

    const {error, stdout} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('config (FOO)')
    expect(stdout).to.include('stack')
    expect(stdout).to.include('heroku-22')
    expect(stdout).to.include('heroku-24')
  })

  it('throws App not found when one app returns 404 on releases', async function () {
    requestStub.callsFake(async (url: string) => {
      if (!url.includes('/releases')) {
        throw new Error(`unexpected request ${url}`)
      }

      if (url.includes(app1Name)) {
        throw httpStatusError(404)
      }

      return {body: releasesWithSlug(slugId2)}
    })

    getStub.callsFake(async (url: string) => {
      if (url.includes('/slugs/')) {
        return {body: slugBody(sameChecksum)}
      }

      throw new Error(`unexpected GET ${url}`)
    })

    const {error} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.not.be.undefined
    expect(error!.message).to.include('App not found')
    expect(error!.message).to.include(app1Name)
  })

  it('throws App not found when slug returns 404', async function () {
    requestStub.callsFake(async (url: string) => {
      if (!url.includes('/releases')) {
        throw new Error(`unexpected request ${url}`)
      }

      const slugId = url.includes(app1Name) ? slugId1 : slugId2
      return {body: releasesWithSlug(slugId)}
    })

    getStub.callsFake(async (url: string) => {
      if (url.includes('/slugs/') && url.includes(app1Name)) {
        throw httpStatusError(404)
      }

      if (url.includes('/slugs/')) {
        return {body: slugBody(sameChecksum)}
      }

      throw new Error(`unexpected GET ${url}`)
    })

    const {error} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.not.be.undefined
    expect(error!.message).to.include('App not found')
    expect(error!.message).to.include(app1Name)
  })

  it('truncates long values to 56 chars with ellipsis', async function () {
    const longChecksum = 'SHA256:' + 'a'.repeat(60)

    requestStub.callsFake(async (url: string) => {
      if (!url.includes('/releases')) {
        throw new Error(`unexpected request ${url}`)
      }

      const slugId = url.includes(app1Name) ? slugId1 : slugId2
      return {body: releasesWithSlug(slugId)}
    })

    getStub.callsFake(async (url: string) => {
      if (url.includes('/slugs/')) {
        const checksum = url.includes(app1Name) ? longChecksum : sameChecksum
        return {body: slugBody(checksum)}
      }

      if (url.includes('/config-vars')) {
        return {body: {}}
      }

      if (url.includes('/buildpack-installations')) {
        return {body: emptyBuildpacks}
      }

      if (url.includes('/addons')) {
        return {body: emptyAddons}
      }

      if (url.includes('/features')) {
        return {body: emptyFeatures}
      }

      if (new RegExp(`/apps/${app1Name}$`).test(url)) {
        return {body: appStack('heroku-22')}
      }

      if (new RegExp(`/apps/${app2Name}$`).test(url)) {
        return {body: appStack('heroku-22')}
      }

      throw new Error(`unexpected GET ${url}`)
    })

    const {error, stdout} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('slug (checksum)')
    expect(stdout).to.match(/\.\.\./)
    expect(stdout).to.include('SHA256:')
  })

  it('shows add-on only on second app', async function () {
    const addons2 = [{addon_service: {name: 'heroku-postgresql'}}]

    requestStub.callsFake(async (url: string) => {
      if (!url.includes('/releases')) {
        throw new Error(`unexpected request ${url}`)
      }

      const slugId = url.includes(app1Name) ? slugId1 : slugId2
      return {body: releasesWithSlug(slugId)}
    })

    getStub.callsFake(async (url: string) => {
      if (url.includes('/slugs/')) {
        return {body: slugBody(sameChecksum)}
      }

      if (url.includes('/config-vars')) {
        return {body: {}}
      }

      if (url.includes('/buildpack-installations')) {
        return {body: emptyBuildpacks}
      }

      if (url.includes('/addons')) {
        return {body: url.includes(app1Name) ? emptyAddons : addons2}
      }

      if (url.includes('/features')) {
        return {body: emptyFeatures}
      }

      if (new RegExp(`/apps/${app1Name}$`).test(url)) {
        return {body: appStack('heroku-22')}
      }

      if (new RegExp(`/apps/${app2Name}$`).test(url)) {
        return {body: appStack('heroku-22')}
      }

      throw new Error(`unexpected GET ${url}`)
    })

    const {error, stdout} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('add-on (heroku-postgresql)')
    expect(stdout).to.include('false')
    expect(stdout).to.include('true')
  })

  it('shows no slug row when both apps have no release slug', async function () {
    const releasesNoSlug = [{status: 'succeeded'}]

    requestStub.callsFake(async (url: string) => {
      if (!url.includes('/releases')) {
        throw new Error(`unexpected request ${url}`)
      }

      return {body: releasesNoSlug}
    })

    getStub.callsFake(async (url: string) => {
      if (url.includes('/slugs/')) {
        throw new Error(`unexpected slug GET ${url}`)
      }

      if (url.includes('/config-vars')) {
        return {body: {}}
      }

      if (url.includes('/buildpack-installations')) {
        return {body: emptyBuildpacks}
      }

      if (url.includes('/addons')) {
        return {body: emptyAddons}
      }

      if (url.includes('/features')) {
        return {body: emptyFeatures}
      }

      if (new RegExp(`/apps/${app1Name}$`).test(url)) {
        return {body: appStack('heroku-22')}
      }

      if (new RegExp(`/apps/${app2Name}$`).test(url)) {
        return {body: appStack('heroku-22')}
      }

      throw new Error(`unexpected GET ${url}`)
    })

    const {error, stdout} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('property')
    expect(stdout.trim()).to.not.include('slug (checksum)')
  })
})
