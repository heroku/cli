import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/addons/detach'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
const {expect} = require('chai')

describe('addons:detach', () => {
  beforeEach(() => {
    stdout.start()
    stderr.start()
  })
  afterEach(() => nock.cleanAll())
  it('detaches an add-on', function () {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/addon-attachments/redis-123')
      .reply(200, {id: 100, name: 'redis-123', addon: {name: 'redis'}})
      .delete('/addon-attachments/100')
      .reply(200)
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])
    return runCommand(Cmd, [
      '--app',
      'myapp',
      'redis-123',
    ])
      .then(() => expect(stdout.output, 'to be empty'))
      .then(() => expect(stderr.output).to.contain('Detaching redis-123 to redis from myapp... done\n'))
      .then(() => expect(stderr.output).to.contain('Unsetting redis-123 config vars and restarting myapp... done, v10\n'))
      .then(() => api.done())
  })
})
