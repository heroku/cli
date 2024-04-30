import {stderr, stdout} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/pg/credentials/repair-default'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import {expect} from 'chai'
import expectOutput from '../../../../helpers/utils/expectOutput'

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
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ])
    expectOutput(stdout.output, '')
    expectOutput(stderr.output, heredoc(`
      Resetting permissions and object ownership for default role to factory settings...
      Resetting permissions and object ownership for default role to factory settings... done
    `))
  })

  it('throws an error when the db is essential plan', async function () {
    const hobbyAddon = {
      name: 'postgres-1', plan: {name: 'heroku-postgresql:hobby-dev'},
    }

    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon: hobbyAddon}])
    const err = "You can't perform this operation on Essential-tier databases."
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ]).catch((error: Error) => expect(error.message).to.equal(err))
  })
})
