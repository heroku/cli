import {expect, test} from '@oclif/test'
import * as fs from 'fs'
import * as logdash from 'lodash'
import * as path from 'path'
import * as sinon from 'sinon'

import Utils from '../../../../src/utils'

describe('enterprises:audits:export', () => {
  const accountsResponse = {
    id: '01234567-89ab-cdef-0123-456789abcdef',
    created_at: '2012-01-01T12:00:00Z',
    name: 'dingo',
    updated_at: '2012-01-01T12:00:00Z',
    identity_provider: {}
  }
  const archiveResponse = {
    year: 2018,
    month: '05',
    created_at: '2018-06-01T00:02:24.870Z',
    checksum: '0da8fa9d50091345951cc5090d82bc4dd965dc33528d7b79188c9508fc9d17db',
    size: 6743,
    url: 'https://heroku-audit-trail-production.s3.amazonaws.com/aY5d996MH3MdNSiFKNv5oQTz'
  }

  const fixtureArchive = path.join(__dirname, '..', '..', '..', 'fixtures', 'archive.json.gz')
  const writeStreamMock = sinon.createStubInstance(fs.WriteStream)
  const createWriteStreamStub = sinon.stub().returns(writeStreamMock)

  test
    .stderr()
    .stub(fs, 'createWriteStream', createWriteStreamStub)
    .stub(logdash.prototype, 'throttle', sinon.stub())
    .stub(Utils, 'filesize', sinon.stub())
    .stub(Utils, 'hasValidChecksum', sinon.stub().returns(true))
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/dingo')
      .reply(200, accountsResponse)
      .get('/enterprise-accounts/01234567-89ab-cdef-0123-456789abcdef/archives/2018/11')
      .reply(200, archiveResponse)
    )
    .nock('https://heroku-audit-trail-production.s3.amazonaws.com', (api: any) => api
      .get('/aY5d996MH3MdNSiFKNv5oQTz')
      .replyWithFile(200, fixtureArchive)
    )
    .command(['enterprises:audits:export', '2018-11', '--enterprise-account', 'dingo'])
    .it('exports the specified audit log', (ctx: any) => {
      expect(createWriteStreamStub.calledOnceWithExactly('enterprise-audit-log-dingo-201811.json.gz')).to.equal(true)
      expect(ctx.stderr).to.contain('done')
    })

  test
    .stderr()
    .stub(fs, 'createWriteStream', createWriteStreamStub)
    .stub(logdash.prototype, 'throttle', sinon.stub())
    .stub(Utils, 'filesize', sinon.stub())
    .stub(Utils, 'hasValidChecksum', sinon.stub().returns(false))
    .nock('https://api.heroku.com', (api: any) => api
      .get('/enterprise-accounts/dingo')
      .reply(200, accountsResponse)
      .get('/enterprise-accounts/01234567-89ab-cdef-0123-456789abcdef/archives/2018/11')
      .reply(200, archiveResponse)
    )
    .nock('https://heroku-audit-trail-production.s3.amazonaws.com', (api: any) => api
      .get('/aY5d996MH3MdNSiFKNv5oQTz')
      .replyWithFile(200, fixtureArchive)
    )
    .command(['enterprises:audits:export', '2018-11', '--enterprise-account', 'dingo'])
    .catch(error => {
      expect(error.message).to.contain('Invalid checksum, please try again.')
    })
    .it('fails to export when checksum is invalid')
})
