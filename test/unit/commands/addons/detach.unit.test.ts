import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import Cmd from '../../../../src/commands/addons/detach.js'
import runCommand from '../../../helpers/runCommand.js'

describe('addons:detach', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('detaches an add-on', function () {
    api
      .get('/apps/myapp/addon-attachments/redis-123')
      .reply(200, {addon: {name: 'redis'}, id: 100, name: 'redis-123'})
      .delete('/addon-attachments/100')
      .reply(200)
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])

    return runCommand(Cmd, ['--app', 'myapp', 'redis-123'])
      .then(() => {
        expect(stdout.output).to.equal('')
        expect(stderr.output).to.contain('Detaching redis-123 to redis from ⬢ myapp... done')
        expect(stderr.output).to.contain('Unsetting redis-123 config vars and restarting ⬢ myapp... done, v10')
      })
  })
})
