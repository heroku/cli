import Cmd from '../../../../../src/commands/pg/backups/download'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import * as fs from 'fs-extra'

describe('pg:backups:download', function () {
  beforeEach(function () {
    nock('https://api.data.heroku.com')
      .post('/client/v11/apps/myapp/transfers/3/actions/public-url')
      .reply(200, {
        url: 'https://api.data.heroku.com/db',
      })
      .get('/db')
      .reply(200, {})
  })

  afterEach(function () {
    nock.cleanAll()
  })

  context('with no id', function () {
    beforeEach(function () {
      nock('https://api.data.heroku.com')
        .get('/client/v11/apps/myapp/transfers')
        .reply(200, [
          {succeeded: true, to_type: 'gof3r', num: 3},
        ])
    })

    it('downloads to latest.dump', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--output',
        './tmp/latest.dump',
      ])
      expect(fs.readFileSync('./tmp/latest.dump', 'utf8')).to.equal('{}')
    })
  })

  context('with id', function () {
    it('downloads to latest.dump', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--output',
        './tmp/latest.dump',
        'b003',
      ])
      expect(fs.readFileSync('./tmp/latest.dump', 'utf8')).to.equal('{}')
    })
  })
})
