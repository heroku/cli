'use strict';

let certs = require('../../../commands/certs/info.js');
let nock  = require('nock');
let expect = require('chai').expect;

let shared              = require('./shared.js');
let shared_sni          = require('./shared_sni.js');
let shared_ssl          = require('./shared_ssl.js');
let endpoint            = require('../../stubs/sni-endpoints.js').endpoint;
let certificate_details = require('../../stubs/sni-endpoints.js').certificate_details;

describe('heroku certs:info ported', function() {
  beforeEach(function() {
    cli.mockConsole();
  });

  it('shows certificate details', function() {
    let mock_ssl = nock('https://api.heroku.com')
    .get('/apps/example/ssl-endpoints')
    .reply(200, [endpoint]);

    let mock_sni = nock('https://api.heroku.com')
    .get('/apps/example/sni-endpoints')
    .reply(200, []);

    let mock = nock('https://api.heroku.com', {
      reqheaders: {'Accept': 'application/vnd.heroku+json; version=3.ssl_cert'}
    })
    .get('/apps/example/ssl-endpoints/tokyo-1050')
    .reply(200, endpoint);

    return certs.run({app: 'example', args: {}, flags: {}}).then(function() {
      mock_ssl.done();
      mock_sni.done();
      mock.done();
      expect(cli.stderr).to.equal('Fetching SSL Endpoint tokyo-1050 info for example... done\n');
      expect(cli.stdout).to.equal(`Certificate details:
${certificate_details}
`);
    });
  });

});

describe('heroku', function() {
  let callback = function(path, endpoint, variant) {
    return nock('https://api.heroku.com', {
      reqheaders: {'Accept': `application/vnd.heroku+json; version=3.${variant}`}
    })
    .get(path)
    .reply(200, endpoint);
  };

  let stderr = function(endpoint) {
    return `Fetching SSL Endpoint ${endpoint.name} info for example... done\n`;
  };

  let stdout = function(certificate_details) {
return `Certificate details:
${certificate_details}
`;
  };

  shared.shouldHandleArgs('certs:info', 'shows certificate details', certs, callback, {
    stderr, stdout
  });

  shared_sni.shouldHandleArgs('certs:info', 'shows certificate details', certs, callback, {
    stderr, stdout
  });

  shared_ssl.shouldHandleArgs('certs:info', 'shows certificate details', certs, callback, {
    stderr, stdout
  });

});

