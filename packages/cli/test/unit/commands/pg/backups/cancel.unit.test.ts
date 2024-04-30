import {stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/backups/cancel'
import runCommand from '../../../../helpers/runCommand'
import {expect} from 'chai'
import * as nock from 'nock'
import heredoc from 'tsheredoc'

describe('pg:backups:cancel', function () {
  let pg: nock.Scope

  beforeEach(function () {
    pg = nock('https://api.data.heroku.com')
      .post('/client/v11/apps/myapp/transfers/100-001/actions/cancel').reply(200, {})
  })

  afterEach(function () {
    pg.done()
    nock.cleanAll()
  })

  context('with no id', function () {
    beforeEach(function () {
      pg.get('/client/v11/apps/myapp/transfers').reply(200, [
        {succeeded: true, to_type: 'gof3r', num: '3', uuid: '100-001'},
      ])
    })

    it('cancels backup', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])

      expect(stderr.output).to.equal(heredoc`
        Cancelling b003...
        Cancelling b003... done
      `)
    })
  })

  context('with id', function () {
    beforeEach(function () {
      pg.get('/client/v11/apps/myapp/transfers/3').reply(200, {
        succeeded: true, to_type: 'gof3r', num: '3', uuid: '100-001',
      })
    })

    it('cancels backup', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'b003',
      ])

      expect(stderr.output).to.equal(heredoc`
        Cancelling b003...
        Cancelling b003... done
      `)
    })
  })
})
