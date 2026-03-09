import {expect} from 'chai'
import nock from 'nock'

import Add from '../../../../src/commands/drains/add.js'
import {runCommand} from '../../../helpers/run-command.js'

describe('drains:add', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('adds a log drain', async function () {
    api
      .post('/apps/myapp/log-drains', {url: 'syslog://logs.example.com'})
      .reply(200, {url: 'syslog://logs.example.com'})

    const {stderr, stdout} = await runCommand(Add, ['-a', 'myapp', 'syslog://logs.example.com'])

    expect(stdout).to.equal('Successfully added drain syslog://logs.example.com\n')
    expect(stderr).to.equal('')
  })
})
