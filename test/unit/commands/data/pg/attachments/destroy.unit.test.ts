import {runCommand} from '@heroku-cli/test-utils'
import {NotFoundError} from '@heroku/heroku-fetch'
import {HerokuSDK} from '@heroku/sdk'
import {getPostgresServiceName} from '@heroku/sdk/resources/data/postgres-database'
import ansis from 'ansis'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import DataPgAttachmentsDestroy from '../../../../../../src/commands/data/pg/attachments/destroy.js'
import {
  addon,
  multipleAttachmentsResponse,
  nonAdvancedAddon,
  releasesResponse,
} from '../../../../../fixtures/data/pg/fixtures.js'

const heredoc = tsheredoc

const attachment = multipleAttachmentsResponse[1]

type FakePlatform = {
  addOn: {resolve: SinonStub}
  addOnAttachment: {delete: SinonStub, infoByApp: SinonStub}
  release: {list: SinonStub}
  withHeaders: SinonStub
}

function buildFakePlatform(): FakePlatform {
  const platform: FakePlatform = {
    addOn: {resolve: stub()},
    addOnAttachment: {delete: stub(), infoByApp: stub()},
    release: {list: stub()},
    withHeaders: stub(),
  }
  platform.withHeaders.returns(platform)
  return platform
}

describe('data:pg:attachments:destroy', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    restore()
  })

  it('shows error for non-advanced databases', async function () {
    fakePlatform.addOnAttachment.infoByApp.resolves({
      ...attachment,
      addon: {
        app: {
          id: nonAdvancedAddon.app.id,
          name: nonAdvancedAddon.app.name,
        },
        id: nonAdvancedAddon.id,
        name: nonAdvancedAddon.name,
      },
    })
    fakePlatform.addOn.resolve.resolves(nonAdvancedAddon)

    const {error} = await runCommand(DataPgAttachmentsDestroy, [
      'DATABASE_ANALYST',
      '--app=myapp',
      '--confirm=myapp',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal('You can only use this command on Advanced-tier databases.\n'
         + 'Use heroku addons:detach DATABASE_ANALYST -a myapp instead.')
    expect(fakePlatform.addOn.resolve.calledOnceWithExactly(nonAdvancedAddon.name, {addonService: getPostgresServiceName()})).to.equal(true)
    expect(fakePlatform.addOnAttachment.delete.called).to.equal(false)
  })

  describe('basic attachment destruction', function () {
    it('destroys an attachment successfully', async function () {
      fakePlatform.addOnAttachment.infoByApp.resolves(attachment)
      fakePlatform.addOn.resolve.resolves(addon)
      fakePlatform.addOnAttachment.delete.resolves(attachment)
      fakePlatform.release.list.resolves(releasesResponse)

      const {stderr, stdout} = await runCommand(DataPgAttachmentsDestroy, [
        'DATABASE_ANALYST',
        '--app=myapp',
        '--confirm=myapp',
      ])

      expect(ansis.strip(stderr)).to.equal(heredoc`
        Detaching DATABASE_ANALYST on ⛁ advanced-horizontal-01234 from ⬢ myapp... done
        Unsetting DATABASE_ANALYST config vars and restarting ⬢ myapp... done, v123
      `)
      expect(stdout).to.equal('')
      expect(fakePlatform.addOnAttachment.infoByApp.calledOnceWithExactly('myapp', 'DATABASE_ANALYST')).to.equal(true)
      expect(fakePlatform.addOn.resolve.calledOnceWithExactly(addon.name, {addonService: getPostgresServiceName()})).to.equal(true)
      expect(fakePlatform.addOnAttachment.delete.calledOnceWithExactly(attachment.id)).to.equal(true)
      expect(fakePlatform.withHeaders.calledOnceWithExactly({Range: 'version ..; max=1, order=desc'})).to.equal(true)
      expect(fakePlatform.release.list.calledOnceWithExactly('myapp')).to.equal(true)
    })
  })

  describe('error handling', function () {
    it('handles attachment not found error', async function () {
      fakePlatform.addOnAttachment.infoByApp.rejects(new NotFoundError(new Response(null, {status: 404}), {
        id: 'not_found',
        message: 'Couldn\'t find that attachment.',
        resource: 'attachment',
      }))

      const {error} = await runCommand(DataPgAttachmentsDestroy, [
        'NONEXISTENT',
        '--app=myapp',
        '--confirm=myapp',
      ])
      const err = error as Error

      expect(err.message).to.equal('Couldn\'t find that attachment.')
      expect(fakePlatform.addOnAttachment.infoByApp.calledOnceWithExactly('myapp', 'NONEXISTENT')).to.equal(true)
      expect(fakePlatform.addOn.resolve.called).to.equal(false)
    })

    it('handles API errors gracefully on the attachment destruction', async function () {
      fakePlatform.addOnAttachment.infoByApp.resolves(attachment)
      fakePlatform.addOn.resolve.resolves(addon)
      fakePlatform.addOnAttachment.delete.rejects(new Error('Internal server error.'))

      const {error, stderr} = await runCommand(DataPgAttachmentsDestroy, [
        'DATABASE_ANALYST',
        '--app=myapp',
        '--confirm=myapp',
      ])
      const err = error as Error
      expect(ansis.strip(err.message)).to.equal('Internal server error.')

      expect(ansis.strip(stderr)).to.equal(heredoc`
        Detaching DATABASE_ANALYST on ⛁ advanced-horizontal-01234 from ⬢ myapp... !
      `)
      expect(fakePlatform.release.list.called).to.equal(false)
    })

    it('handles API errors gracefully on the release retrieval', async function () {
      fakePlatform.addOnAttachment.infoByApp.resolves(attachment)
      fakePlatform.addOn.resolve.resolves(addon)
      fakePlatform.addOnAttachment.delete.resolves(attachment)
      fakePlatform.release.list.rejects(new Error('Internal server error.'))

      const {error, stderr} = await runCommand(DataPgAttachmentsDestroy, [
        'DATABASE_ANALYST',
        '--app=myapp',
        '--confirm=myapp',
      ])
      const err = error as Error
      expect(ansis.strip(err.message)).to.equal('Internal server error.')

      expect(ansis.strip(stderr)).to.equal(heredoc`
        Detaching DATABASE_ANALYST on ⛁ advanced-horizontal-01234 from ⬢ myapp... done
        Unsetting DATABASE_ANALYST config vars and restarting ⬢ myapp... !
      `)
    })
  })
})
