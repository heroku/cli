'use strict'
/* globals beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let certs = require('../../../../commands/certs/remove.js')
let error = require('../../../../lib/error.js')

let endpoint = require('../../../stubs/sni-endpoints.js').endpoint
let sharedSni = require('./shared_sni.unit.test.js')

describe('heroku certs:remove', function () {
  beforeEach(function () {
    cli.mockConsole()
    error.exit.mock()
    nock.cleanAll()
  })

  it('# deletes the endpoint', function () {
    let mockGet = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])
    let mockDelete = nock('https://api.heroku.com')
      .delete('/apps/example/sni-endpoints/' + endpoint.name)
      .reply(200, [endpoint])

    return certs.run({app: 'example', flags: {confirm: 'example'}}).then(function () {
      mockGet.done()
      mockDelete.done()
      expect(cli.stderr).to.equal('Removing SSL certificate tokyo-1050 (tokyo-1050.herokussl.com) from example... done\n')
    })
  })

  it('# requires confirmation if wrong endpoint on app', function () {
    let mockSni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])

    var thrown = false
    return certs.run({app: 'example', flags: {confirm: 'notexample'}}).catch(function (error_) {
      thrown = true
      mockSni.done()
      expect(error_.message).to.equal('Confirmation notexample did not match example. Aborted.')
    }).then(function () {
      expect(thrown).to.equal(true)
    })
  })

  let callback = function (err, path, endpoint, variant) {
    if (err) throw err

    return nock('https://api.heroku.com', {
      reqheaders: {Accept: `application/vnd.heroku+json; version=3.${variant}`},
    })
      .delete(path)
      .reply(200, endpoint)
  }

  let stderr = function () {
    return `Removing SSL certificate ${endpoint.name} (${endpoint.cname}) from example... done
`
  }

  let stdout = function () {
    return ''
  }

  sharedSni.shouldHandleArgs('certs:remove', 'removes an endpoint', certs, callback, {
    stderr, stdout, flags: {confirm: 'example'},
  })
})
