import {expect} from 'chai'
import nock from 'nock'

import Remove from '../../../../src/commands/drains/remove.js'
import {runCommand} from '../../../helpers/run-command.js'

describe('drains:remove', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('removes a log drain', async function () {
    api
      .delete('/apps/myapp/log-drains/syslog%3A%2F%2Flogs.example.com')
      .reply(200, {url: 'syslog://logs.example.com'})

    const {stderr, stdout} = await runCommand(Remove, ['-a', 'myapp', 'syslog://logs.example.com'])

    expect(stdout).to.equal('Successfully removed drain syslog://logs.example.com\n')
    expect(stderr).to.equal('')
  })
})
