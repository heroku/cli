'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let certs = require('../../../commands/certs/remove.js')
let error = require('../../../lib/error.js')

let endpoint = require('../../stubs/sni-endpoints.js').endpoint
let sharedSni = require('./shared_sni.js')

describe('heroku certs:remove', function () {
  beforeEach(function () {
    cli.mockConsole()
    error.exit.mock()
    nock.cleanAll()
  })

  it('# requires confirmation', function () {
    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [])

    var thrown = false
    return certs.run({ app: 'example', flags: { confirm: 'notexample' } }).catch(function (err) {
      thrown = true
      mockSni.done()
      expect(err.message).to.equal('Confirmation notexample did not match example. Aborted.')
    }).then(function () {
      expect(thrown).to.equal(true)
    })
  })

  it('# requires confirmation', function () {
    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])

    var thrown = false
    return certs.run({ app: 'example', flags: { confirm: 'notexample' } }).catch(function (err) {
      thrown = true
      mockSni.done()
      expect(err.message).to.equal('Confirmation notexample did not match example. Aborted.')
    }).then(function () {
      expect(thrown).to.equal(true)
    })
  })

  let callback = function (err, path, endpoint, variant) {
    if (err) throw err

    return nock('https://api.heroku.com', {
      reqheaders: { 'Accept': `application/vnd.heroku+json; version=3.${variant}` }
    })
      .delete(path)
      .reply(200, endpoint)
  }

  let stderr = function () {
    return `Removing SSL certificate ${endpoint.name} (${endpoint.cname}) from example... done
`
  }

  let stdout = function () {
    return ``
  }

  sharedSni.shouldHandleArgs('certs:remove', 'removes an endpoint', certs, callback, {
    stderr, stdout, flags: { confirm: 'example' }
  })
})
