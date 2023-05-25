/* eslint-env mocha */
'use strict'

let chai = require('chai')
let expect = require('chai').expect
let nock = require('nock')
let sinon = require('sinon')
let sinonChai = require('sinon-chai')
chai.should()
chai.use(sinonChai)

let cli = require('heroku-cli-util')
let childProcess = require('child_process')

let certs = require('../../../../commands/certs/generate.js')
let endpoint = require('../../../stubs/sni-endpoints.js').endpoint

let EventEmitter = require('events').EventEmitter

function mockPrompt(argument, returns) {
  return cli.prompt.withArgs(argument).returns(new Promise(function (resolve) {
    resolve(returns)
  }))
}

describe('heroku certs:generate', function () {
  beforeEach(function () {
    cli.mockConsole()

    nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])

    // stub cli here using sinon
    // if this works, remove proxyquire
    sinon.stub(cli, 'prompt')

    sinon.stub(childProcess, 'spawn', function () {
      let eventEmitter = new EventEmitter()
      process.nextTick(function () {
        eventEmitter.emit('close', 0)
      })
      return eventEmitter
    })
  })

  afterEach(function () {
    cli.prompt.restore()
    childProcess.spawn.restore()
  })

  it('# with certificate prompts emitted if no parts of subject provided', function () {
    let owner = mockPrompt('Owner of this certificate', 'Heroku')
    let country = mockPrompt('Country of owner (two-letter ISO code)', 'US')
    let area = mockPrompt('State/province/etc. of owner', 'California')
    let city = mockPrompt('City of owner', 'San Francisco')

    return certs.run({app: 'example', args: {domain: 'example.com'}, flags: {}}).then(function () {
      expect(owner).to.have.been.called
      expect(country).to.have.been.called
      expect(area).to.have.been.called
      expect(city).to.have.been.called

      expect(cli.stdout).to.equal('')

      expect(childProcess.spawn).to.have.been.calledWith('openssl', ['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', '/C=US/ST=California/L=San Francisco/O=Heroku/CN=example.com'])
    })
  })

  it('# not emitted if any part of subject is specified', function () {
    return certs.run({app: 'example', args: {domain: 'example.com'}, flags: {owner: 'Heroku'}}).then(function () {
      expect(cli.prompt).to.have.not.been.called

      expect(cli.stdout).to.equal('')

      expect(childProcess.spawn).to.have.been.calledWith('openssl', ['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', '/O=Heroku/CN=example.com'])
    })
  })

  it('# not emitted if --now is specified', function () {
    return certs.run({app: 'example', args: {domain: 'example.com'}, flags: {now: true}}).then(function () {
      expect(cli.prompt).to.have.not.been.called

      expect(cli.stdout).to.equal('')

      expect(childProcess.spawn).to.have.been.calledWith('openssl', ['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', '/CN=example.com'])
    })
  })

  it('# not emitted if --subject is specified', function () {
    return certs.run({app: 'example', args: {domain: 'example.com'}, flags: {subject: 'SOMETHING'}}).then(function () {
      expect(cli.prompt).to.have.not.been.called

      expect(cli.stdout).to.equal('')

      expect(childProcess.spawn).to.have.been.calledWith('openssl', ['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', 'SOMETHING'])
    })
  })

  it('# without --selfsigned does not request a self-signed certificate', function () {
    return certs.run({app: 'example', args: {domain: 'example.com'}, flags: {now: true}}).then(function () {
      expect(cli.prompt).to.have.not.been.called

      expect(cli.stdout).to.equal('')

      expect(cli.stderr).to.equal(
        `Your key and certificate signing request have been generated.
Submit the CSR in 'example.com.csr' to your preferred certificate authority.
When you've received your certificate, run:
$ heroku certs:add CERTFILE example.com.key
`)

      expect(childProcess.spawn).to.have.been.calledWith('openssl', ['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', '/CN=example.com'])
    })
  })

  it('# with --selfsigned does request a self-signed certificate', function () {
    return certs.run({app: 'example', args: {domain: 'example.com'}, flags: {now: true, selfsigned: true}}).then(function () {
      expect(cli.prompt).to.have.not.been.called

      expect(cli.stdout).to.equal('')

      expect(cli.stderr).to.equal(
        `Your key and self-signed certificate have been generated.
Next, run:
$ heroku certs:add example.com.crt example.com.key
`)

      expect(childProcess.spawn).to.have.been.calledWith('openssl', ['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.crt', '-subj', '/CN=example.com', '-x509'])
    })
  })

  it('# suggests next step should be certs:update when domain is known in sni', function () {
    return certs.run({app: 'example', args: {domain: 'example.org'}, flags: {now: true}}).then(function () {
      expect(cli.prompt).to.have.not.been.called

      expect(cli.stdout).to.equal('')

      expect(cli.stderr).to.equal(
        `Your key and certificate signing request have been generated.
Submit the CSR in 'example.org.csr' to your preferred certificate authority.
When you've received your certificate, run:
$ heroku certs:update CERTFILE example.org.key
`)

      expect(childProcess.spawn).to.have.been.calledWith('openssl', ['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.org.key', '-out', 'example.org.csr', '-subj', '/CN=example.org'])
    })
  })

  it('# suggests next step should be certs:update when domain is known in ssl', function () {
    nock.cleanAll()

    nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [])

    return certs.run({app: 'example', args: {domain: 'example.org'}, flags: {now: true}}).then(function () {
      expect(cli.prompt).to.have.not.been.called

      expect(cli.stdout).to.equal('')

      expect(cli.stderr).to.equal(
        `Your key and certificate signing request have been generated.
Submit the CSR in 'example.org.csr' to your preferred certificate authority.
When you've received your certificate, run:
$ heroku certs:add CERTFILE example.org.key
`)

      expect(childProcess.spawn).to.have.been.calledWith('openssl', ['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.org.key', '-out', 'example.org.csr', '-subj', '/CN=example.org'])
    })
  })

  it('# key size can be changed using keysize', function () {
    return certs.run({app: 'example', args: {domain: 'example.org'}, flags: {now: true, keysize: '4096'}}).then(function () {
      expect(cli.prompt).to.have.not.been.called

      expect(cli.stdout).to.equal('')

      expect(cli.stderr).to.equal(
        `Your key and certificate signing request have been generated.
Submit the CSR in 'example.org.csr' to your preferred certificate authority.
When you've received your certificate, run:
$ heroku certs:update CERTFILE example.org.key
`)

      expect(childProcess.spawn).to.have.been.calledWith('openssl', ['req', '-new', '-newkey', 'rsa:4096', '-nodes', '-keyout', 'example.org.key', '-out', 'example.org.csr', '-subj', '/CN=example.org'])
    })
  })
})

/* jshint +W030 */
