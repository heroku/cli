import {stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/backups/cancel'
import runCommand from '../../../../helpers/runCommand'
import {expect} from 'chai'
import * as nock from 'nock'
import heredoc from 'tsheredoc'

describe('pg:backups:cancel', () => {
  let pg: nock.Scope

  beforeEach(() => {
    pg = nock('https://api.data.heroku.com')
      .post('/client/v11/apps/myapp/transfers/100-001/actions/cancel').reply(200, {})
  })

  afterEach(() => {
    pg.done()
    nock.cleanAll()
  })

  context('with no id', () => {
    beforeEach(() => {
      pg.get('/client/v11/apps/myapp/transfers').reply(200, [
        {succeeded: true, to_type: 'gof3r', num: '3', uuid: '100-001'},
      ])
    })

    it('cancels backup', async () => {
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

  context('with id', () => {
    beforeEach(() => {
      pg.get('/client/v11/apps/myapp/transfers/3').reply(200, {
        succeeded: true, to_type: 'gof3r', num: '3', uuid: '100-001',
      })
    })

    it('cancels backup', async () => {
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
