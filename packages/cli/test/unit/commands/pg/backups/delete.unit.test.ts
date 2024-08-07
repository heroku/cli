import {stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/backups/delete'
import runCommand from '../../../../helpers/runCommand'
import {expect} from 'chai'
import * as nock from 'nock'

describe('pg:backups:delete', function () {
  let pg: nock.Scope

  beforeEach(function () {
    pg = nock('https://api.data.heroku.com')
      .delete('/client/v11/apps/myapp/transfers/3')
      .reply(200, {
        url: 'https://dburl',
      })
  })

  afterEach(function () {
    nock.cleanAll()
    pg.done()
  })

  it('shows URL', async function () {
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
      'b003',
    ])
    expect(stderr.output).to.equal('Deleting backup b003 on ⬢ myapp...\nDeleting backup b003 on ⬢ myapp... done\n')
  })
})
