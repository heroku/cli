import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../../src/commands/pg/backups/delete.js'

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
    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
      'b003',
    ])
    expect(stderr).to.equal('Deleting backup b003 on ⬢ myapp... done\n')
  })
})
