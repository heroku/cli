'use strict'
/* globals commands beforeEach nock expect */

let cli = require('heroku-cli-util')
cli.open = require('../../../opn')
let cmd = commands.find(c => c.topic === 'addons' && c.command === 'open')

describe('addons:open', function () {
  beforeEach(() => cli.mockConsole())

  describe('testing sudo', function () {
    beforeEach(() => {
      process.env.HEROKU_SUDO = true
    })

    it('uses file path via sso to open url', function () {
      let api = nock('https://api.heroku.com:443')

      api.get('/apps/myapp/addons/db2/sso')
        .reply(200, {action: 'exampleURL', method: 'get'})

      return cmd.run({app: 'myapp', args: {addon: 'db2'}, flags: {'show-url': true}})
        .then(() => expect(cli.stdout).to.equal('Opening exampleURL...\n'))
        .then(() => api.done())
    })

    it('writes sudo template to file and opens url', function () {
      let api = nock('https://api.heroku.com:443')

      api.get('/apps/myapp/addons/db2/sso')
        .reply(200, {action: 'exampleURL'})

      return cmd.run({app: 'myapp', args: {addon: 'db2'}, flags: {'show-url': true}})
        .then(() => expect(cli.stdout).to.contain('Opening file://'))
        .then(() => api.done())
    })
  })

  it('only prints the URL when --show-url passed', function () {
    let api = nock('https://api.heroku.com:443')

    api.post('/actions/addons/resolve', {app: 'myapp', addon: 'db2'})
      .reply(200, [{id: 'db2', web_url: 'http://db2'}])

    api.get('/addons/db2/addon-attachments')
      .reply(200, [])

    return cmd.run({app: 'myapp', args: {addon: 'db2'}, flags: {'show-url': true}})
      .then(() => expect(cli.stdout).to.equal('http://db2\n'))
      .then(() => api.done())
  })

  it('opens the addon dashboard in a browser by default', function () {
    let api = nock('https://api.heroku.com:443')

    api.post('/actions/addons/resolve', {app: 'myapp', addon: 'slowdb'})
      .reply(200, [{id: 'slowdb', web_url: 'http://slowdb'}])

    api.get('/addons/slowdb/addon-attachments')
      .reply(200, [])

    return cmd.run({app: 'myapp', args: {addon: 'slowdb'}, flags: {'show-url': false}})
      .then(() => expect(cli.open.url).to.equal('http://slowdb'))
      .then(() => expect(cli.stdout).to.equal('Opening http://slowdb...\n'))
      .then(() => api.done())
  })

  it('opens an attached addon, by slug, with the correct `context_app`', function () {
    let api = nock('https://api.heroku.com:443')

    api.post('/actions/addon-attachments/resolve', {app: 'myapp-2', addon_attachment: 'slowdb'})
      .reply(404, {resource: 'add_on attachment'})

    api.post('/actions/addons/resolve', {app: 'myapp-2', addon: 'slowdb'})
      .reply(404, {resource: 'add_on'})

    api.post('/actions/addons/resolve', {app: null, addon: 'slowdb'})
      .reply(200, [{id: 'c7c9cf20-ec87-11e5-aea4-0002a5d5c51b', web_url: 'http://myapp-slowdb'}])

    api.get('/addons/c7c9cf20-ec87-11e5-aea4-0002a5d5c51b/addon-attachments')
      .reply(200, [
        {app: {name: 'myapp'}, web_url: 'http://myapp-slowdb'},
        {app: {name: 'myapp-2'}, web_url: 'http://myapp-2-slowdb'},
      ])

    return cmd.run({app: 'myapp-2', args: {addon: 'slowdb'}, flags: {'show-url': false}})
      .then(() => expect(cli.open.url).to.equal('http://myapp-2-slowdb'))
      .then(() => expect(cli.stdout).to.equal('Opening http://myapp-2-slowdb...\n'))
      .then(() => api.done())
  })
})
