import {stdout, stderr} from 'stdout-stderr'
import * as nock from 'nock'
import {expect} from 'chai'
import Cmd  from '../../../../src/commands/apps/lock'
import runCommand from '../../../helpers/runCommand'
describe('heroku apps:lock', function () {
  afterEach(function () {
    return nock.cleanAll()
  })

  it('locks the app', async function () {
    const apiGetApp = nock('https://api.heroku.com:443')
      .get('/teams/apps/myapp')
      .reply(200, {name: 'myapp', locked: false})
      .patch('/teams/apps/myapp', {locked: true})
      .reply(200)
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect('').to.eq(stdout.output)
    expect('Locking myapp...\nLocking myapp... done\n').to.eq(stderr.output)
    apiGetApp.done()
  })

  it('returns an error if the app is already locked', async function () {
    const apiGetApp = nock('https://api.heroku.com:443')
      .get('/teams/apps/myapp')
      .reply(200, {name: 'myapp', locked: true})
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
      .catch((error: any) => {
        expect('').to.eq(stdout.output)
        expect(error.message).to.eq('Error: cannot lock \u001B[36mmyapp\u001B[39m.\nThis app is already locked.')
      })
    apiGetApp.done()
  })
})
