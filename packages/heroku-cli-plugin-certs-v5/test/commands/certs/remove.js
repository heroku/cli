'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let certs = require('../../../commands/certs/remove.js')
let error = require('../../../lib/error.js')

let endpoint = require('../../stubs/sni-endpoints.js').endpoint
let shared = require('./shared.js')
let sharedSsl = require('./shared_ssl.js')
let sharedSni = require('./shared_sni.js')

describe('heroku certs:remove', function () {
  beforeEach(function () {
    cli.mockConsole()
    error.exit.mock()
    nock.cleanAll()
  })

  it('# requires confirmation', function () {
    let mockSsl = nock('https://api.heroku.com')
      .get('/apps/example/ssl-endpoints')
      .reply(200, [endpoint])

    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [])

    var thrown = false
    return certs.run({app: 'example', flags: {confirm: 'notexample'}}).catch(function (err) {
      thrown = true
      mockSsl.done()
      mockSni.done()
      expect(err).to.equal('Confirmation notexample did not match example. Aborted.')
    }).then(function () {
      expect(thrown).to.equal(true)
    })
  })

  it('# does not output the note if billing is no longer active', function () {
    let mockAddons = nock('https://api.heroku.com')
      .get('/apps/example/addons/ssl%3Aendpoint')
      .reply(404, {
        'id': 'not_found',
        'resource': 'addon'
      })

    let mockSsl = nock('https://api.heroku.com')
      .get('/apps/example/ssl-endpoints')
      .reply(200, [])

    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])

    let mock = nock('https://api.heroku.com', {
      reqheaders: {'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert'}
    })
      .delete('/apps/example/sni-endpoints/tokyo-1050')
      .reply(200, endpoint)

    return certs.run({app: 'example', flags: {confirm: 'example'}}).then(function () {
      mockAddons.done()
      mockSsl.done()
      mockSni.done()
      mock.done()
      expect(cli.stderr).to.equal('Removing SSL certificate tokyo-1050 (tokyo-1050.herokussl.com) from example... done\n')
      expect(cli.stdout).to.equal('')
    })
  })

  it('# does output the note if billing is active', function () {
    let mockAddon = nock('https://api.heroku.com')
      .get('/apps/example/addons/ssl%3Aendpoint')
      .reply(200, {})

    let mockSsl = nock('https://api.heroku.com')
      .get('/apps/example/ssl-endpoints')
      .reply(200, [])

    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])

    let mock = nock('https://api.heroku.com', {
      reqheaders: {'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert'}
    })
      .delete('/apps/example/sni-endpoints/tokyo-1050')
      .reply(200, endpoint)

    return certs.run({app: 'example', flags: {confirm: 'example'}}).then(function () {
      mockAddon.done()
      mockSsl.done()
      mockSni.done()
      mock.done()
      expect(cli.stderr).to.equal('Removing SSL certificate tokyo-1050 (tokyo-1050.herokussl.com) from example... done\n')
      expect(cli.stdout).to.equal('NOTE: Billing is still active. Remove SSL Endpoint add-on to stop billing.\n')
    })
  })

  it('# requires confirmation', function () {
    let mockSsl = nock('https://api.heroku.com')
      .get('/apps/example/ssl-endpoints')
      .reply(200, [endpoint])

    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [])

    var thrown = false
    return certs.run({app: 'example', flags: {confirm: 'notexample'}}).catch(function (err) {
      thrown = true
      mockSsl.done()
      mockSni.done()
      expect(err).to.equal('Confirmation notexample did not match example. Aborted.')
    }).then(function () {
      expect(thrown).to.equal(true)
    })
  })

  let callback = function (path, endpoint, variant) {
    nock('https://api.heroku.com')
      .get('/apps/example/addons/ssl%3Aendpoint')
      .reply(200, {})

    return nock('https://api.heroku.com', {
      reqheaders: {'Accept': `application/vnd.heroku+json; version=3.${variant}`}
    })
      .delete(path)
      .reply(200, endpoint)
  }

  let stderr = function () {
    return `Removing SSL certificate ${endpoint.name} (${endpoint.cname}) from example... done
`
  }

  let stdout = function () {
    return `NOTE: Billing is still active. Remove SSL Endpoint add-on to stop billing.
`
  }

  shared.shouldHandleArgs('certs:remove', 'removes an endpoint', certs, callback, {
    stderr, stdout, flags: {confirm: 'example'}
  })

  sharedSsl.shouldHandleArgs('certs:remove', 'removes an endpoint', certs, callback, {
    stderr, stdout, flags: {confirm: 'example'}
  })

  sharedSni.shouldHandleArgs('certs:remove', 'removes an endpoint', certs, callback, {
    stderr, stdout, flags: {confirm: 'example'}
  })
})
