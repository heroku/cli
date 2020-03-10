'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let error = require('../../../lib/error.js')

let endpoint = require('../../stubs/sni-endpoints.js').endpoint
let endpoint2 = require('../../stubs/sni-endpoints.js').endpoint2
let assertExit = require('../../assert_exit.js')
let certificateDetails = require('../../stubs/sni-endpoints.js').certificate_details
const unwrap = require('../../unwrap')
const mockSniFeatureFlag = require('../../lib/mock_sni_feature')

exports.shouldHandleArgs = function (command, txt, certs, callback, options) {
  let args = options.args || {}
  let flags = options.flags || {}
  let stdout = options.stdout || function () { return '' }
  let stderr = options.stderr || function () { return '' }

  describe(`${command}`, function () {
    beforeEach(function () {
      cli.mockConsole()
      error.exit.mock()
      nock.cleanAll()
      mockSniFeatureFlag(nock, 'example')
    })

    it('# shows an error if an app has no endpoints', function () {
      let mockSsl = nock('https://api.heroku.com')
        .get('/apps/example/ssl-endpoints')
        .reply(200, [])

      let mockSni = nock('https://api.heroku.com')
        .get('/apps/example/sni-endpoints')
        .reply(200, [])

      return assertExit(1, certs.run({ app: 'example', args: args, flags: { bypass: true, confirm: 'example' } })).then(function () {
        mockSsl.done()
        mockSni.done()
        expect(unwrap(cli.stderr)).to.equal('example has no SSL certificates\n')
        expect(cli.stdout).to.equal('')
      })
    })

    it('# errors out if there is no arg but there are multiple ', function () {
      let mockSsl = nock('https://api.heroku.com')
        .get('/apps/example/ssl-endpoints')
        .reply(200, [endpoint])

      let mockSni = nock('https://api.heroku.com')
        .get('/apps/example/sni-endpoints')
        .reply(200, [endpoint2])

      return assertExit(1, certs.run({ app: 'example', args: args, flags: { bypass: true, confirm: 'example' } })).then(function () {
        mockSsl.done()
        mockSni.done()
        expect(unwrap(cli.stderr)).to.equal('Must pass --name when more than one endpoint\n')
        expect(cli.stdout).to.equal('')
      })
    })

    it('# allows an SSL certificate to be specified using --endpoint', function () {
      let mockSsl = nock('https://api.heroku.com')
        .get('/apps/example/ssl-endpoints')
        .reply(200, [endpoint])

      let mockSni = nock('https://api.heroku.com')
        .get('/apps/example/sni-endpoints')
        .reply(200, [])

      let mock = callback(null, '/apps/example/ssl-endpoints/tokyo-1050', endpoint, 'ssl_cert')

      return certs.run({ app: 'example', args: args, flags: Object.assign({}, flags, { endpoint: 'tokyo-1050.herokussl.com' }) }).then(function () {
        mockSsl.done()
        mockSni.done()
        mock.done()
        expect(cli.stderr).to.equal(stderr(endpoint))
        expect(cli.stdout).to.equal(stdout(certificateDetails, endpoint))
      })
    })

    it('# --endpoint errors out if there is no match', function () {
      let mockSsl = nock('https://api.heroku.com')
        .get('/apps/example/ssl-endpoints')
        .reply(200, [])

      let mockSni = nock('https://api.heroku.com')
        .get('/apps/example/sni-endpoints')
        .reply(200, [endpoint2])

      return assertExit(1, certs.run({ app: 'example', args: args, flags: Object.assign({}, flags, { endpoint: 'tokyo-1050.herokussl.com' }) })).then(function () {
        mockSsl.done()
        mockSni.done()
        expect(unwrap(cli.stderr)).to.equal('Record not found.\n')
        expect(cli.stdout).to.equal('')
      })
    })

    it('# --name errors out in the case where more than one matches', function () {
      let mockSsl = nock('https://api.heroku.com')
        .get('/apps/example/ssl-endpoints')
        .reply(200, [endpoint])

      let mockSni = nock('https://api.heroku.com')
        .get('/apps/example/sni-endpoints')
        .reply(200, [endpoint])

      return assertExit(1, certs.run({ app: 'example', args: args, flags: { bypass: true, name: 'tokyo-1050', confirm: 'example' } })).then(function () {
        mockSsl.done()
        mockSni.done()
        expect(unwrap(cli.stderr)).to.equal('More than one endpoint matches tokyo-1050, please file a support ticket\n')
        expect(cli.stdout).to.equal('')
      })
    })

    it('# --name and --endpoint errors out', function () {
      return assertExit(1, certs.run({ app: 'example', args: args, flags: { bypass: true, name: 'tokyo-1050', endpoint: 'tokyo-1050.herokussl.com', confirm: 'example' } })).then(function () {
        expect(unwrap(cli.stderr)).to.equal('Specified both --name and --endpoint, please use just one\n')
        expect(cli.stdout).to.equal('')
      })
    })
  })
}
