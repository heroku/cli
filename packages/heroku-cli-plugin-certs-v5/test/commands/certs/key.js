'use strict';

let expect = require('chai').expect;
let nock   = require('nock');
var fs     = require('fs');
var sinon  = require('sinon');

let certs = require('../../../commands/certs/key.js');
let assert_exit = require('../../assert_exit.js');
let error  = require('../../../lib/error.js');

describe('heroku certs:key', function() {
  beforeEach(function() {
    cli.mockConsole();
    error.exit.mock();

    sinon.stub(fs, 'readFile');
    fs.readFile.throws('unstubbed');

    nock.cleanAll();
  });

  afterEach(function() {
    fs.readFile.restore();
  });

  it('# validates that at least one argument is passed', function() {
    return assert_exit(1, certs.run({app: 'example', args: ['foo']})).then(function() {
      expect(cli.stderr).to.equal(
` ▸    Usage: heroku _certs:key CRT KEY [KEY ...]
 ▸    Must specify one certificate file and at least one key file.
`);
      expect(cli.stdout).to.equal('');
    });
  });

  it('# posts all certs to ssl doctor', function() {
    fs.readFile
      .withArgs('a_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'pem content');
    fs.readFile
      .withArgs('b_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'key a content');
    fs.readFile
      .withArgs('c_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'key b content');

    let ssl_doctor = nock('https://ssl-doctor.herokuapp.com', {
      reqheaders: {
        'content-type': 'application/octet-stream',
        'content-length': '39'
      }
    })
    .post('/resolve-chain-and-key', "pem content\nkey a content\nkey b content")
    .reply(200, {pem: 'pem content', key: 'key b content'});

    return certs.run({app: 'example', args: ['a_file', 'b_file', 'c_file']}).then(function() {
      ssl_doctor.done();
      expect(cli.stderr).to.equal('Testing for signing key... done\n');
      expect(cli.stdout).to.equal(
`key b content`);
    });
  });

});
