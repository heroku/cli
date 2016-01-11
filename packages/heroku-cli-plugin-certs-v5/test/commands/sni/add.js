'use strict';

let expect = require('chai').expect;
let nock   = require('nock');
var fs     = require('fs');
var sinon  = require('sinon');

let certs = require('../../../commands/sni/add.js');

let endpoint            = require('../../stubs/sni-endpoints.js').endpoint;
let endpoint_warning    = require('../../stubs/sni-endpoints.js').endpoint_warning;
let certificate_details = require('../../stubs/sni-endpoints.js').certificate_details;

describe('heroku certs:add', function() {
  beforeEach(function() {
    cli.mockConsole();
    sinon.stub(fs, 'readFile');
    nock.cleanAll();
  });

  afterEach(function() {
    fs.readFile.restore();
  });

  it('# posts to ssl doctor', function() {
    fs.readFile
      .withArgs('pem_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'pem content');
    fs.readFile
      .withArgs('key_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'key content');

    let ssl_doctor = nock('https://ssl-doctor.herokuapp.com', {
      reqheaders: {
        'content-type': 'application/octet-stream',
        'content-length': '23'
      }
    })
    .post('/resolve-chain-and-key', "pem content\nkey content")
    .reply(200, {pem: 'pem content', key: 'key content'});

    let mock = nock('https://api.heroku.com')
    .post('/apps/example/sni-endpoints', {
      certificate_chain: 'pem content', private_key: 'key content', app: 'example'
    })
    .reply(200, endpoint);

    return certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {}}).then(function() {
      ssl_doctor.done();
      mock.done();
      expect(cli.stderr).to.equal('Resolving trust chain... done\nAdding SSL Endpoint to example... done\n');
      expect(cli.stdout).to.equal(
`example now served by tokyo-1050.herokussl.com
Certificate details:
${certificate_details}
`);
    });
  });

  it('# propegates ssl doctor errors', function() {
    fs.readFile
      .withArgs('pem_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'pem content');
    fs.readFile
      .withArgs('key_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'key content');

    let ssl_doctor = nock('https://ssl-doctor.herokuapp.com', {
      reqheaders: {
        'content-type': 'application/octet-stream',
        'content-length': '23'
      }
    })
    .post('/resolve-chain-and-key', "pem content\nkey content")
    .reply(422, "No certificate given is a domain name certificate.");

    return certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {}})
    .then(function() {
      expect.fail("Expected exception");
    })
    .catch(function(err) {
      ssl_doctor.done();
      expect(cli.stdout).to.equal('');
      expect(cli.stderr).to.equal('Resolving trust chain... !!!\n');
      expect(err.message).to.equal("No certificate given is a domain name certificate.");
    });
  });

  it('# bypasses ssl doctor', function() {
    fs.readFile
      .withArgs('pem_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'pem content');
    fs.readFile
      .withArgs('key_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'key content');

    let mock = nock('https://api.heroku.com')
    .post('/apps/example/sni-endpoints', {
      certificate_chain: 'pem content', private_key: 'key content', app: 'example'
    })
    .reply(200, endpoint);

    return certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {bypass: true}}).then(function() {
      mock.done();
      expect(cli.stderr).to.equal('Adding SSL Endpoint to example... done\n');
      expect(cli.stdout).to.equal(
`example now served by tokyo-1050.herokussl.com
Certificate details:
${certificate_details}
`);
    });
  });

  it('# displays warnings', function() {
    fs.readFile
      .withArgs('pem_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'pem content');
    fs.readFile
      .withArgs('key_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'key content');

    let mock = nock('https://api.heroku.com')
    .post('/apps/example/sni-endpoints', {
      certificate_chain: 'pem content', private_key: 'key content', app: 'example'
    })
    .reply(200, endpoint_warning);

    return certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {bypass: true}}).then(function() {
      mock.done();
      expect(cli.stderr).to.equal('Adding SSL Endpoint to example... done\n ▸    WARNING: ssl_cert provides no domain(s) that are configured for this Heroku app\n');
    });
  });

});
