import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'

import ObjectStoreAttachmentsIndex from '../../../../../src/commands/object-store/attachments/index.js'
import {
  addon,
  attachmentsResponse,
  emptyAttachmentsResponse,
  nonObjectStoreAddon,
} from '../../../../fixtures/object-store/fixtures.js'
import removeAllWhitespace from '../../../../helpers/utils/remove-whitespaces.js'

describe('object-store:attachments', function () {
  it('throws a not found error when the add-on is not an object store', async function () {
    const herokuApi = nock('https://api.heroku.com')
      .post('/actions/addons/resolve')
      .reply(200, [nonObjectStoreAddon])

    const {error} = await runCommand(ObjectStoreAttachmentsIndex, [
      'redis-database',
      '--app=myapp',
    ])
    const err = error as Error

    herokuApi.done()
    expect(ansis.strip(err.message)).to.include('Couldn\'t find that addon.')
  })

  describe('when attachments exist', function () {
    it('displays attachments with their credentials', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, attachmentsResponse)

      const {stderr, stdout} = await runCommand(ObjectStoreAttachmentsIndex, [
        'object-store-crystalline-01234',
        '--app=myapp',
      ])

      herokuApi.done()
      expect(stderr).to.equal('')
      const output = ansis.strip(removeAllWhitespace(stdout))
      expect(output).to.include(removeAllWhitespace('Attachments for object-store-crystalline-01234'))
      expect(output).to.include(removeAllWhitespace('Attachment Credential'))
      expect(output).to.include(removeAllWhitespace('myapp::OBJECT_STORE default (default)'))
      expect(output).to.include(removeAllWhitespace('myapp::REPORTS reports'))
    })
  })

  describe('when no attachments exist', function () {
    it('displays an appropriate message for empty attachments', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])
        .get(`/addons/${addon.id}/addon-attachments`)
        .reply(200, emptyAttachmentsResponse)

      const {stderr, stdout} = await runCommand(ObjectStoreAttachmentsIndex, [
        'object-store-crystalline-01234',
        '--app=myapp',
      ])

      herokuApi.done()
      expect(stderr).to.equal('')
      expect(ansis.strip(stdout)).to.equal('No attachments found for this object store.\n')
    })
  })
})
