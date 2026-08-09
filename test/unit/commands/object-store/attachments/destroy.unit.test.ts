import {runCommand} from '@heroku-cli/test-utils'
import {utils} from '@heroku/heroku-cli-util'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import ObjectStoreAttachmentsDestroy from '../../../../../src/commands/object-store/attachments/destroy.js'
import {OBJECT_STORE_ADDON_SERVICE} from '../../../../../src/lib/object-store/addon.js'
import {
  addon,
  destroyAttachment,
  releasesResponse,
} from '../../../../fixtures/object-store/fixtures.js'

const heredoc = tsheredoc.default

describe('object-store:attachments:destroy', function () {
  let resolveStub: SinonStub

  beforeEach(function () {
    resolveStub = stub(utils.AddonResolver.prototype, 'resolve')
  })

  afterEach(function () {
    restore()
  })

  it('detaches an attachment successfully', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments/REPORTS')
      .reply(200, destroyAttachment)
      .delete(`/addon-attachments/${destroyAttachment.id}`)
      .reply(200, destroyAttachment)
      .get('/apps/myapp/releases')
      .reply(200, releasesResponse)
    resolveStub.withArgs(addon.name, undefined, OBJECT_STORE_ADDON_SERVICE)
      .resolves(addon)

    const {stderr, stdout} = await runCommand(ObjectStoreAttachmentsDestroy, [
      'REPORTS',
      '--app=myapp',
      '--confirm=myapp',
    ])

    herokuApi.done()
    expect(ansis.strip(stderr)).to.equal(heredoc`
      Detaching REPORTS on object-store-crystalline-01234 from ⬢ myapp... done
      Unsetting REPORTS config vars and restarting ⬢ myapp... done, v123
    `)
    expect(stdout).to.equal('')
  })

  it('handles attachment not found error', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments/NONEXISTENT')
      .reply(404, {
        id: 'not_found',
        message: 'Couldn\'t find that attachment.',
        resource: 'attachment',
      })

    const {error} = await runCommand(ObjectStoreAttachmentsDestroy, [
      'NONEXISTENT',
      '--app=myapp',
      '--confirm=myapp',
    ])
    const err = error as Error

    expect(err.message).to.equal(heredoc`
        Couldn't find that attachment.

        Error ID: not_found`)
    herokuApi.done()
  })

  it('handles API errors gracefully on the attachment destruction', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments/REPORTS')
      .reply(200, destroyAttachment)
      .delete(`/addon-attachments/${destroyAttachment.id}`)
      .reply(500, {
        id: 'internal_server_error',
        message: 'Internal server error.',
      })
    resolveStub.withArgs(addon.name, undefined, OBJECT_STORE_ADDON_SERVICE)
      .resolves(addon)

    const {error, stderr} = await runCommand(ObjectStoreAttachmentsDestroy, [
      'REPORTS',
      '--app=myapp',
      '--confirm=myapp',
    ])
    const err = error as Error

    expect(ansis.strip(err.message)).to.equal(heredoc`
      Internal server error.

      Error ID: internal_server_error`)
    herokuApi.done()
    expect(ansis.strip(stderr)).to.equal(heredoc`
      Detaching REPORTS on object-store-crystalline-01234 from ⬢ myapp... !
    `)
  })
})
