'use strict'
// eslint-disable-next-line no-redeclare
/* globals describe it beforeEach afterEach cli */

let chai = require('chai')

let chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

let expect = chai.expect
let assert = chai.assert
let nock = require('nock')
var fs = require('fs')
var sinon = require('sinon')

let proxyquire = require('proxyquire').noCallThru()
let inquirer
let certs

let endpoint = require('../../stubs/sni-endpoints.js').endpoint
let endpointHeroku = require('../../stubs/sni-endpoints.js').endpoint_heroku
let endpointStables = require('../../stubs/sni-endpoints.js').endpoint_stables
let endpointWarning = require('../../stubs/sni-endpoints.js').endpoint_warning
let endpointWildcard = require('../../stubs/sni-endpoints.js').endpoint_wildcard
let certificateDetails = require('../../stubs/sni-endpoints.js').certificate_details

let error = require('../../../lib/error.js')
let assertExit = require('../../assert_exit.js')
let unwrap = require('../../unwrap.js')

let lolex = require('lolex')

function mockDomains(inquirer) {
  nock('https://api.heroku.com')
    .get('/apps/example/domains')
    .reply(200, [])

  inquirer.prompt = prompts => {
    return Promise.resolve({domains: []})
  }
}

function mockFile(fs, file, content) {
  fs.readFile
    .withArgs(file, 'utf-8', sinon.match.func)
    .callsArgWithAsync(2, null, content)
}

describe('heroku certs:add', function () {
  beforeEach(function () {
    cli.mockConsole()
    sinon.stub(fs, 'readFile')
    nock.cleanAll()
    error.exit.mock()

    inquirer = {}
    certs = proxyquire('../../../commands/certs/add', {inquirer})
  })

  afterEach(function () {
    fs.readFile.restore()
  })

  it('# errors out when args < 2', function () {
    nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {space: null})

    return assertExit(1, certs.run({app: 'example', args: ['pem_file'], flags: {}})).then(function () {
      expect(unwrap(cli.stderr)).to.equal('Usage: heroku certs:add CRT KEY\n')
      expect(cli.stdout).to.equal('')
    })
  })

  it('# works with a cert and key', function () {
    nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {space: null})

    mockDomains(inquirer)

    mockFile(fs, 'pem_file', 'pem content')
    mockFile(fs, 'key_file', 'key content')

    let mockSni = nock('https://api.heroku.com')
      .post('/apps/example/sni-endpoints', {
        certificate_chain: 'pem content', private_key: 'key content',
      })
      .reply(200, endpoint)

    return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {}}).then(function () {
      mockSni.done()
      expect(cli.stderr).to.equal('Adding SSL certificate to example... done\n')
      expect(cli.stdout).to.equal(
        `example now served by tokyo-1050.herokussl.com
Certificate details:
${certificateDetails}
`)
    })
  })

  it('# errors out with intermediaries', function () {
    nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {space: null})

    return assertExit(1, certs.run({app: 'example', args: ['pem_file', 'int_file', 'key_file'], flags: {}})).then(function () {
      expect(unwrap(cli.stderr)).to.equal('Usage: heroku certs:add CRT KEY\n')
      expect(cli.stdout).to.equal('')
    })
  })

  it('# displays warnings', function () {
    nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {space: null})

    mockDomains(inquirer)

    mockFile(fs, 'pem_file', 'pem content')
    mockFile(fs, 'key_file', 'key content')

    let mockSni = nock('https://api.heroku.com')
      .post('/apps/example/sni-endpoints', {
        certificate_chain: 'pem content', private_key: 'key content',
      })
      .reply(200, endpointWarning)

    return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {}}).then(function () {
      mockSni.done()
      expect(unwrap(cli.stderr)).to.equal('Adding SSL certificate to example... done\n')
    })
  })

  it('# creates an SNI endpoint', function () {
    nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {space: null})

    mockDomains(inquirer)

    mockFile(fs, 'pem_file', 'pem content')
    mockFile(fs, 'key_file', 'key content')

    let mock = nock('https://api.heroku.com')
      .post('/apps/example/sni-endpoints', {
        certificate_chain: 'pem content', private_key: 'key content',
      })
      .reply(200, endpoint)

    return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {}}).then(function () {
      mock.done()
      expect(cli.stderr).to.equal('Adding SSL certificate to example... done\n')
      expect(cli.stdout).to.equal(
        `example now served by tokyo-1050.herokussl.com
Certificate details:
${certificateDetails}
`)
    })
    /* eslint-enable no-irregular-whitespace */
  })

  it('# shows the configure prompt', function () {
    nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {space: null})

    nock('https://api.heroku.com')
      .get('/apps/example/domains')
      .reply(200, [{id: 123, hostname: 'example.org'}])

    mockDomains(inquirer)
    mockFile(fs, 'pem_file', 'pem content')
    mockFile(fs, 'key_file', 'key content')

    let mockSni = nock('https://api.heroku.com')
      .post('/apps/example/sni-endpoints', {
        certificate_chain: 'pem content', private_key: 'key content',
      })
      .reply(200, endpoint)

    return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {}}).then(function () {
      mockSni.done()
      expect(cli.stderr).to.equal('Adding SSL certificate to example... done\n')
      expect(cli.stdout).to.equal(
        `example now served by tokyo-1050.herokussl.com
Certificate details:
${certificateDetails}
=== Almost done! Which of these domains on this application would you like this certificate associated with?
`)
    })
  })

  describe('stable cnames', function () {
    beforeEach(function () {
      nock('https://api.heroku.com')
        .get('/apps/example')
        .reply(200, {space: null})

      mockFile(fs, 'pem_file', 'pem content')
      mockFile(fs, 'key_file', 'key content')
    })

    it('# prompts creates an SNI endpoint with stable cnames', function () {
      let mock = nock('https://api.heroku.com')
        .post('/apps/example/sni-endpoints', {
          certificate_chain: 'pem content', private_key: 'key content',
        })
        .reply(200, endpointStables)

      let domainsMock = nock('https://api.heroku.com')
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'custom', hostname: 'biz.example.com', cname: 'biz.example.com.herokudns.com'},
          {kind: 'custom', hostname: 'baz.example.org', cname: 'baz.example.org.herokudns.com'},
          {kind: 'custom', hostname: 'example.org', cname: 'example.org.herokudns.com'},
          {kind: 'custom', hostname: 'example.co.uk', cname: 'example.co.uk.herokudns.com'},
          {kind: 'heroku', hostname: 'haiku.herokuapp.com', cname: 'haiku.herokuapp.com'},
        ])

      inquirer.prompt = prompts => {
        let choices = prompts[0].choices
        expect(choices).to.eql([
          'biz.example.com',
        ])
        return Promise.resolve({domains: choices})
      }

      let domainsCreate = nock('https://api.heroku.com')
        .patch('/apps/example/domains/biz.example.com')
        .reply(200)

      return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {}}).then(function () {
        mock.done()
        domainsMock.done()
        domainsCreate.done()
        expect(unwrap(cli.stderr)).to.equal('Adding SSL certificate to example... done\n')
        expect(cli.stdout).to.equal(
          `Certificate details:
Common Name(s): foo.example.org
                bar.example.org
                biz.example.com
Expires At:     2013-08-01 21:34 UTC
Issuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
Starts At:      2012-08-01 21:34 UTC
Subject:        /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
SSL certificate is self signed.
=== Almost done! Which of these domains on this application would you like this certificate associated with?
`)
        /* eslint-enable no-trailing-spaces */
      })
    })

    it('# does not error out if the cert CN is for the heroku domain', function () {
      let mock = nock('https://api.heroku.com')
        .post('/apps/example/sni-endpoints', {
          certificate_chain: 'pem content', private_key: 'key content',
        })
        .reply(200, endpointHeroku)

      let domainsMock = nock('https://api.heroku.com')
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        ])

      let domainsMockPatch = nock('https://api.heroku.com')
        .patch('/apps/example/domains/tokyo-1050.herokuapp.com')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        ])

      inquirer.prompt = prompts => {
        let choices = prompts[0].choices
        expect(choices).to.eql([
          'tokyo-1050.herokuapp.com',
        ])
        return Promise.resolve({domains: choices})
      }

      return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {}}).then(function () {
        mock.done()
        domainsMock.done()
        domainsMockPatch.done()
        expect(unwrap(cli.stderr)).to.equal('Adding SSL certificate to example... done\n')
        expect(cli.stdout).to.equal(
          `Certificate details:
Common Name(s): tokyo-1050.herokuapp.com
Expires At:     2013-08-01 21:34 UTC
Issuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=heroku.com
Starts At:      2012-08-01 21:34 UTC
Subject:        /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=tokyo-1050.herokuapp.com
SSL certificate is not trusted.
=== Almost done! Which of these domains on this application would you like this certificate associated with?
`)
        /* eslint-enable no-trailing-spaces */
        /* eslint-enable no-irregular-whitespace */
      })
    })

    it('# does not prompt if domains covered with wildcard', function () {
      let mock = nock('https://api.heroku.com')
        .post('/apps/example/sni-endpoints', {
          certificate_chain: 'pem content', private_key: 'key content',
        })
        .reply(200, endpointStables)

      let domainsMock = nock('https://api.heroku.com')
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'custom', hostname: '*.example.org', cname: 'wildcard.example.org.herokudns.com'},
          {kind: 'custom', hostname: '*.example.com', cname: 'wildcard.example.com.herokudns.com'},
        // { 'kind': 'custom', 'hostname': 'biz.example.com', 'cname': 'biz.example.com.herokudns.com' }
        ])

      inquirer.prompt = prompts => {
        expect.fail('inquirer.prompt() should not be called')
      }

      return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {}}).then(function () {
        mock.done()
        domainsMock.done()
        expect(unwrap(cli.stderr)).to.equal('Adding SSL certificate to example... done\n')
        expect(cli.stdout).to.equal(
          `Certificate details:
Common Name(s): foo.example.org
                bar.example.org
                biz.example.com
Expires At:     2013-08-01 21:34 UTC
Issuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
Starts At:      2012-08-01 21:34 UTC
Subject:        /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
SSL certificate is self signed.
`)
        /* eslint-enable no-trailing-spaces */
      })
    })

    it('# does not prompt if no domains and wildcard cert', function () {
      let mock = nock('https://api.heroku.com')
        .post('/apps/example/sni-endpoints', {
          certificate_chain: 'pem content', private_key: 'key content',
        })
        .reply(200, endpointWildcard)

      let domainsMock = nock('https://api.heroku.com')
        .get('/apps/example/domains')
        .reply(200, [])

      inquirer.prompt = prompts => {
        expect.fail('inquirer.prompt() should not be called')
      }

      return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {}}).then(function () {
        mock.done()
        domainsMock.done()
        expect(unwrap(cli.stderr)).to.equal('Adding SSL certificate to example... done\n')
        expect(cli.stdout).to.equal(
          `Certificate details:
Common Name(s): *.example.org
Expires At:     2013-08-01 21:34 UTC
Issuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
Starts At:      2012-08-01 21:34 UTC
Subject:        /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
SSL certificate is self signed.
`)
        /* eslint-enable no-irregular-whitespace */
        /* eslint-enable no-trailing-spaces */
      })
    })

    it('# prints mismatched domains for wildcard cert', function () {
      let mock = nock('https://api.heroku.com')
        .post('/apps/example/sni-endpoints', {
          certificate_chain: 'pem content', private_key: 'key content',
        })
        .reply(200, endpointWildcard)

      let domainsMock = nock('https://api.heroku.com')
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'custom', hostname: 'foo.example.org', cname: 'foo.example.org.herokudns.com'},
          {kind: 'custom', hostname: 'bar.example.com', cname: 'bar.example.com.herokudns.com'},
        ])

      let domainsMockPatch = nock('https://api.heroku.com')
        .patch('/apps/example/domains/foo.example.org')
        .reply(200)

      inquirer.prompt = prompts => {
        let choices = prompts[0].choices
        expect(choices).to.eql([
          'foo.example.org',
        ])
        return Promise.resolve({domains: choices})
      }

      return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {}}).then(function () {
        mock.done()
        domainsMock.done()
        domainsMockPatch.done()
        expect(unwrap(cli.stderr)).to.equal('Adding SSL certificate to example... done\n')
        expect(cli.stdout).to.equal(
          `Certificate details:
Common Name(s): *.example.org
Expires At:     2013-08-01 21:34 UTC
Issuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
Starts At:      2012-08-01 21:34 UTC
Subject:        /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
SSL certificate is self signed.
=== Almost done! Which of these domains on this application would you like this certificate associated with?
`)
        /* eslint-enable no-irregular-whitespace */
        /* eslint-enable no-trailing-spaces */
      })
    })

    describe('waiting for domains', function () {
      let clock

      beforeEach(function () {
        cli.mockConsole()
        clock = lolex.install()
        clock.setTimeout = function (fn, timeout) {
          fn()
        }
      })

      afterEach(function () {
        clock.uninstall()
      })

      it('# waits for custom domains to have a cname', function () {
        let mock = nock('https://api.heroku.com')
          .post('/apps/example/sni-endpoints', {
            certificate_chain: 'pem content', private_key: 'key content',
          })
          .reply(200, endpointStables)

        let domainsMock = nock('https://api.heroku.com')
          .get('/apps/example/domains')
          .reply(200, [
            {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, status: 'none'},
            {kind: 'custom', hostname: 'foo.example.org', cname: null, status: 'none'},
            {kind: 'custom', hostname: 'bar.example.org', cname: null, status: 'none'},
            {kind: 'custom', hostname: 'biz.example.com', cname: null, status: 'none'},
          ])

        let domainsRetry = nock('https://api.heroku.com')
          .get('/apps/example/domains')
          .reply(200, [
            {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, status: 'none'},
            {kind: 'custom', hostname: 'foo.example.org', cname: null, status: 'none'},
            {kind: 'custom', hostname: 'bar.example.org', cname: 'bar.example.org.herokudns.com', status: 'succeeded'},
            {kind: 'custom', hostname: 'biz.example.com', cname: 'biz.example.com.herokudns.com', status: 'succeeded'},
          ])

        let domainsSuccess = nock('https://api.heroku.com')
          .get('/apps/example/domains')
          .reply(200, [
            {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, status: 'none'},
            {kind: 'custom', hostname: 'foo.example.org', cname: 'foo.example.org.herokudns.com', status: 'succeeded'},
            {kind: 'custom', hostname: 'bar.example.org', cname: 'bar.example.org.herokudns.com', status: 'succeeded'},
            {kind: 'custom', hostname: 'biz.example.com', cname: 'biz.example.com.herokudns.com', status: 'succeeded'},
          ])

        let domainsCreateFoo = nock('https://api.heroku.com')
          .patch('/apps/example/domains/foo.example.org')
          .reply(200)

        let domainsCreateBar = nock('https://api.heroku.com')
          .patch('/apps/example/domains/bar.example.org')
          .reply(200)

        let domainsCreateBiz = nock('https://api.heroku.com')
          .patch('/apps/example/domains/biz.example.com')
          .reply(200)

        inquirer.prompt = prompts => {
          let choices = prompts[0].choices
          expect(choices).to.eql([
            'foo.example.org',
            'bar.example.org',
            'biz.example.com',
          ])
          return Promise.resolve({domains: choices})
        }

        return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {}}).then(function () {
          mock.done()
          domainsMock.done()
          domainsRetry.done()
          domainsSuccess.done()
          domainsCreateFoo.done()
          domainsCreateBar.done()
          domainsCreateBiz.done()
          expect(unwrap(cli.stderr)).to.equal('Adding SSL certificate to example... done\nWaiting for stable domains to be created... done\n')
          expect(cli.stdout).to.equal(
            `Certificate details:
Common Name(s): foo.example.org
                bar.example.org
                biz.example.com
Expires At:     2013-08-01 21:34 UTC
Issuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
Starts At:      2012-08-01 21:34 UTC
Subject:        /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
SSL certificate is self signed.
=== Almost done! Which of these domains on this application would you like this certificate associated with?
`)
          /* eslint-enable no-trailing-spaces */
        })
      })

      it('# tries 30 times and then gives up', function () {
        let mock = nock('https://api.heroku.com')
          .post('/apps/example/sni-endpoints', {
            certificate_chain: 'pem content', private_key: 'key content',
          })
          .reply(200, endpointStables)

        let domainsMock = nock('https://api.heroku.com')
          .get('/apps/example/domains')
          .times(31)
          .reply(200, [
            {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, status: 'none'},
            {kind: 'custom', hostname: 'foo.example.org', cname: null, status: 'none'},
            {kind: 'custom', hostname: 'bar.example.org', cname: null, status: 'none'},
            {kind: 'custom', hostname: 'biz.example.com', cname: null, status: 'none'},
          ])

        return assert.isRejected(certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {}}), /Timed out while waiting for stable domains to be created/).then(function () {
          mock.done()
          domainsMock.done()
          expect(unwrap(cli.stderr)).to.equal('Adding SSL certificate to example... done\nWaiting for stable domains to be created... !\n')
          expect(cli.stdout).to.equal(
            `Certificate details:
Common Name(s): foo.example.org
                bar.example.org
                biz.example.com
Expires At:     2013-08-01 21:34 UTC
Issuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
Starts At:      2012-08-01 21:34 UTC
Subject:        /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org
SSL certificate is self signed.
`)
          /* eslint-enable no-trailing-spaces */
        })
      })
    })
  })

  it('warns on deprecated --bypass flag', function () {
    nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {space: null})

    mockDomains(inquirer)

    mockFile(fs, 'pem_file', 'pem content')
    mockFile(fs, 'key_file', 'key content')

    let mock = nock('https://api.heroku.com')
      .post('/apps/example/sni-endpoints', {
        certificate_chain: 'pem content', private_key: 'key content',
      })
      .reply(200, endpoint)

    return certs.run({app: 'example', args: ['pem_file', 'key_file'], flags: {bypass: true}}).then(function () {
      mock.done()
      expect(cli.stderr).to.include('use of the --bypass flag is deprecated.')
      expect(cli.stderr).to.include('Adding SSL certificate to example... done')
    })
  })
})
