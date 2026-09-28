import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import fs from 'fs-extra'
import nock from 'nock'
import {restore, type SinonStub, stub} from 'sinon'

import Cmd from '../../../../../src/commands/pg/backups/download.js'
import {type MockSDK, mockSDKData} from '../../../../helpers/mock-sdk.js'

describe('pg:backups:download', function () {
  let publicUrlStub: SinonStub
  let sdkMock: MockSDK

  beforeEach(function () {
    publicUrlStub = stub().resolves({url: 'https://api.data.heroku.com/db'})
    nock('https://api.data.heroku.com')
      .get('/db')
      .reply(200, {})
  })

  afterEach(function () {
    nock.cleanAll()
    restore()
  })

  context('with no id', function () {
    beforeEach(function () {
      sdkMock = mockSDKData({
        transfer: {
          listByApp: stub().resolves([
            {num: 3, succeeded: true, to_type: 'gof3r'},
          ]),
          publicUrl: publicUrlStub,
        },
      })
    })

    it('downloads to latest.dump', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--output',
        './tmp/latest.dump',
      ])
      expect(fs.readFileSync('./tmp/latest.dump', 'utf8')).to.equal('{}')
      expect(publicUrlStub.calledOnceWithExactly('myapp', '3', {})).to.equal(true)
    })
  })

  context('with id', function () {
    it('downloads to latest.dump', async function () {
      sdkMock = mockSDKData({transfer: {publicUrl: publicUrlStub}})

      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--output',
        './tmp/latest.dump',
        'b003',
      ])
      expect(fs.readFileSync('./tmp/latest.dump', 'utf8')).to.equal('{}')
      expect(publicUrlStub.calledOnceWithExactly('myapp', '3', {})).to.equal(true)
    })
  })
})
