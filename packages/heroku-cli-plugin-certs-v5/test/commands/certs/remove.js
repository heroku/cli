'use strict';

let expect = require('chai').expect;
let nock   = require('nock');
let certs = require('../../../commands/certs/remove.js');
let error  = require('../../../lib/error.js');

let endpoint   = require('../../stubs/sni-endpoints.js').endpoint;
let shared     = require('./shared.js');
let shared_ssl = require('./shared_ssl.js');
let shared_sni = require('./shared_sni.js');

describe('heroku certs:remove', function() {
  beforeEach(function() {
    cli.mockConsole();
    error.exit.mock();
  });

  it('# requires confirmation', function() {
    let mock_ssl = nock('https://api.heroku.com')
    .get('/apps/example/ssl-endpoints')
    .reply(200, [endpoint]);

    let mock_sni = nock('https://api.heroku.com')
    .get('/apps/example/sni-endpoints')
    .reply(200, []);

    var thrown = false;
    return certs.run({app: 'example', flags: {confirm: 'notexample'}}).catch(function(err) {
      thrown = true;
      mock_ssl.done();
      mock_sni.done();
      expect(err).to.equal('Confirmation notexample did not match example. Aborted.');
    }).then(function() {
      expect(thrown).to.equal(true);   
    });
  });

  it ('# does not output the note if billing is no longer active', function() {
    let mock_ssl = nock('https://api.heroku.com')
    .get('/apps/example/ssl-endpoints')
    .reply(403, {
        "id":"ssl_endpoint_addon_required",
        "error":"The SSL Endpoint add-on needs to be installed on this app to manage endpoints."
    });

    let mock_sni = nock('https://api.heroku.com')
    .get('/apps/example/sni-endpoints')
    .reply(200, [endpoint]);

    let mock = nock('https://api.heroku.com', {
      reqheaders: {'Accept': `application/vnd.heroku+json; version=3.sni_ssl_cert`}
    })
    .delete('/apps/example/sni-endpoints/tokyo-1050')
    .reply(200, endpoint);

    return certs.run({app: 'example', flags: {confirm: 'example'}}).
    then(function() {
      mock_ssl.done();
      mock_sni.done();
      mock.done();
      expect(cli.stderr).to.equal('Removing SSL Endpoint tokyo-1050 (tokyo-1050.herokussl.com) from example... done\n');
      expect(cli.stdout).to.equal('');
    });
  });

  it ('# does output the note if billing is active', function() {
    let mock_ssl = nock('https://api.heroku.com')
    .get('/apps/example/ssl-endpoints')
    .reply(200, []);

    let mock_sni = nock('https://api.heroku.com')
    .get('/apps/example/sni-endpoints')
    .reply(200, [endpoint]);

    let mock = nock('https://api.heroku.com', {
      reqheaders: {'Accept': `application/vnd.heroku+json; version=3.sni_ssl_cert`}
    })
    .delete('/apps/example/sni-endpoints/tokyo-1050')
    .reply(200, endpoint);

    return certs.run({app: 'example', flags: {confirm: 'example'}}).
    then(function() {
      mock_ssl.done();
      mock_sni.done();
      mock.done();
      expect(cli.stderr).to.equal('Removing SSL Endpoint tokyo-1050 (tokyo-1050.herokussl.com) from example... done\n');
      expect(cli.stdout).to.equal('NOTE: Billing is still active. Remove SSL Endpoint add-on to stop billing.\n');
    });
  });

  it('# requires confirmation', function() {
    let mock_ssl = nock('https://api.heroku.com')
    .get('/apps/example/ssl-endpoints')
    .reply(200, [endpoint]);

    let mock_sni = nock('https://api.heroku.com')
    .get('/apps/example/sni-endpoints')
    .reply(200, []);

    var thrown = false;
    return certs.run({app: 'example', flags: {confirm: 'notexample'}}).catch(function(err) {
      thrown = true;
      mock_ssl.done();
      mock_sni.done();
      expect(err).to.equal('Confirmation notexample did not match example. Aborted.');
    }).then(function() {
      expect(thrown).to.equal(true);   
    });
  });

  let callback = function(path, endpoint, variant) {
    return nock('https://api.heroku.com', {
      reqheaders: {'Accept': `application/vnd.heroku+json; version=3.${variant}`}
    })
    .delete(path)
    .reply(200, endpoint);
  };

  let stderr = function() {
    return `Removing SSL Endpoint ${endpoint.name} (${endpoint.cname}) from example... done\n`;
  };

  let stdout = function() {
    return `NOTE: Billing is still active. Remove SSL Endpoint add-on to stop billing.\n`;
  };

  shared.shouldHandleArgs('certs:update', 'removes an endpoint', certs, callback, {
    stderr, stdout, flags: {confirm: 'example'}
  });

  shared_ssl.shouldHandleArgs('certs:update', 'removes an endpoint', certs, callback, {
    stderr, stdout, flags: {confirm: 'example'}
  });

  shared_sni.shouldHandleArgs('certs:update', 'removes an endpoint', certs, callback, {
    stderr, stdout, flags: {confirm: 'example'}
  });

});
