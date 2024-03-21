import Cmd from '../../../../../src/commands/pg/backups/download'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import * as fs from 'fs-extra'

describe.only('pg:backups:download', () => {
  beforeEach(() => {
    nock('https://api.data.heroku.com')
      .post('/client/v11/apps/myapp/transfers/3/actions/public-url')
      .reply(200, {
        url: 'https://api.data.heroku.com/db',
      })
      .get('/db')
      .reply(200, {})
  })
  afterEach(() => {
    nock.cleanAll()
  })
  context('with no id', () => {
    beforeEach(() => {
      nock('https://api.data.heroku.com')
        .get('/client/v11/apps/myapp/transfers')
        .reply(200, [
          {succeeded: true, to_type: 'gof3r', num: 3},
        ])
    })
    it('downloads to latest.dump', async () => {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--output',
        './tmp/latest.dump',
      ])
      expect(fs.readFileSync('./tmp/latest.dump', 'utf8')).to.equal('{}')
    })
  })
  context('with id', () => {
    it('downloads to latest.dump', async () => {
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
