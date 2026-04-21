import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/credentials/repair-default.js'

const heredoc = tsheredoc.default

describe('pg:credentials:repair-default', function () {
  const addon = {
    name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'},
  }

  afterEach(function () {
    nock.cleanAll()
  })

  it('resets the credential permissions', async function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.data.heroku.com')
      .post('/postgres/v0/databases/postgres-1/repair-default')
      .reply(200)
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ])
    expectOutput(stdout, '')
    expectOutput(stderr, heredoc(`
      Resetting permissions and object ownership for default role to factory settings... done
    `))
  })

  it('throws an error when the db is essential plan', async function () {
    const hobbyAddon = {
      name: 'postgres-1', plan: {name: 'heroku-postgresql:mini'},
    }

    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: hobbyAddon}])
    const err = "You can't perform this operation on Essential-tier databases."
    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ])
    expect(error!.message).to.equal(err)
  })
})
