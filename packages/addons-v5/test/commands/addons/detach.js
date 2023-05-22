'use strict'
/* globals beforeEach afterEach nock cli commands */

let cmd = commands.find(c => c.topic === 'addons' && c.command === 'detach')
const {expect} = require('chai')

describe('addons:detach', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('detaches an add-on', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/addon-attachments/redis-123')
      .reply(200, {id: 100, name: 'redis-123', addon: {name: 'redis'}})
      .delete('/addon-attachments/100')
      .reply(200)
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])
    return cmd.run({app: 'myapp', args: {attachment_name: 'redis-123'}})
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr).to.equal(`Detaching redis-123 to redis from myapp... done
Unsetting redis-123 config vars and restarting myapp... done, v10
`))
      .then(() => api.done())
  })
})
