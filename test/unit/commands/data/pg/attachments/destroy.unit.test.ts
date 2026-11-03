import {runCommand} from '@heroku-cli/test-utils'
import {NotFoundError} from '@heroku/heroku-fetch'
import {HerokuSDK} from '@heroku/sdk'
import {NotAdvancedDatabaseError} from '@heroku/sdk/resources/data/postgres-database'
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
const releaseVersion = releasesResponse[0].version

type DeleteAttachmentOptions = {
  beforeDelete?: (preview: {addon: typeof addon; attachment: typeof attachment}) => Promise<void> | void
  onDetached?: (attachment: typeof attachment) => Promise<void> | void
}

interface FakeData {
  postgresDatabase: {deleteAttachment: SinonStub}
}

// The command owns the confirmation prompt and the two-phase status rendering
// but delegates resolution, the delete, and the release fetch to the SDK.
// These fakes stand in for the resolving `data.postgresDatabase.deleteAttachment`,
// invoking the command's `beforeDelete`/`onDetached` callbacks the way the real
// method does so the confirm/detach/unset render path is covered.
async function deleteResolving(_app: string, _name: string, options: DeleteAttachmentOptions = {}) {
  await options.beforeDelete?.({addon, attachment})
  await options.onDetached?.(attachment)
  return {addon, attachment, releaseVersion}
}

async function deleteResolvingWithoutRelease(_app: string, _name: string, options: DeleteAttachmentOptions = {}) {
  await options.beforeDelete?.({addon, attachment})
  await options.onDetached?.(attachment)
  return {addon, attachment, releaseVersion: undefined}
}

const deleteFailingAtDelete = (error: unknown) => async (_app: string, _name: string, options: DeleteAttachmentOptions = {}) => {
  await options.beforeDelete?.({addon, attachment})
  throw error
}

const deleteFailingAtRelease = (error: unknown) => async (_app: string, _name: string, options: DeleteAttachmentOptions = {}) => {
  await options.beforeDelete?.({addon, attachment})
  await options.onDetached?.(attachment)
  throw error
}

describe('data:pg:attachments:destroy', function () {
  let fakeData: FakeData

  beforeEach(function () {
    fakeData = {postgresDatabase: {deleteAttachment: stub()}}
    stub(HerokuSDK.prototype, 'data').get(() => fakeData)
  })

  afterEach(function () {
    restore()
  })

  it('shows error for non-advanced databases', async function () {
    fakeData.postgresDatabase.deleteAttachment.rejects(new NotAdvancedDatabaseError(nonAdvancedAddon, 'not advanced'))

    const {error} = await runCommand(DataPgAttachmentsDestroy, [
      'DATABASE_ANALYST',
      '--app=myapp',
      '--confirm=myapp',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal('You can only use this command on Advanced-tier databases.\n'
         + 'Use heroku addons:detach DATABASE_ANALYST -a myapp instead.')
    expect(fakeData.postgresDatabase.deleteAttachment.calledOnce).to.equal(true)
    const [app, name] = fakeData.postgresDatabase.deleteAttachment.firstCall.args
    expect(app).to.equal('myapp')
    expect(name).to.equal('DATABASE_ANALYST')
  })

  describe('basic attachment destruction', function () {
    it('destroys an attachment successfully', async function () {
      fakeData.postgresDatabase.deleteAttachment.callsFake(deleteResolving)

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
      expect(fakeData.postgresDatabase.deleteAttachment.calledOnce).to.equal(true)
      const [app, name] = fakeData.postgresDatabase.deleteAttachment.firstCall.args
      expect(app).to.equal('myapp')
      expect(name).to.equal('DATABASE_ANALYST')
    })

    it('omits the release version when none is returned', async function () {
      fakeData.postgresDatabase.deleteAttachment.callsFake(deleteResolvingWithoutRelease)

      const {stderr} = await runCommand(DataPgAttachmentsDestroy, [
        'DATABASE_ANALYST',
        '--app=myapp',
        '--confirm=myapp',
      ])

      expect(ansis.strip(stderr)).to.equal(heredoc`
        Detaching DATABASE_ANALYST on ⛁ advanced-horizontal-01234 from ⬢ myapp... done
        Unsetting DATABASE_ANALYST config vars and restarting ⬢ myapp... done
      `)
    })
  })

  describe('error handling', function () {
    it('handles attachment not found error', async function () {
      fakeData.postgresDatabase.deleteAttachment.rejects(new NotFoundError(new Response(null, {status: 404}), {
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
      expect(fakeData.postgresDatabase.deleteAttachment.firstCall.args[1]).to.equal('NONEXISTENT')
    })

    it('handles API errors gracefully on the attachment destruction', async function () {
      fakeData.postgresDatabase.deleteAttachment.callsFake(deleteFailingAtDelete(new Error('Internal server error.')))

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
    })

    it('handles API errors gracefully on the release retrieval', async function () {
      fakeData.postgresDatabase.deleteAttachment.callsFake(deleteFailingAtRelease(new Error('Internal server error.')))

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
