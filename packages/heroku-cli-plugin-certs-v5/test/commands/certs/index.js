'use strict';

let expect = require('chai').expect;
let nock   = require('nock');
let certs = require('../../../commands/certs/index.js');

let endpoint            = require('../../stubs/sni-endpoints.js').endpoint;
let endpoint2           = require('../../stubs/sni-endpoints.js').endpoint2;

describe('heroku certs', function() {
  beforeEach(function() {
    cli.mockConsole();
  });

  describe('(ported)', function() {
    it('# shows a list of certs', function() {
      let mock_sni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, []);
  
      let mock_ssl = nock('https://api.heroku.com')
      .get('/apps/example/ssl-endpoints')
      .reply(200, [endpoint, endpoint2]);
  
      return certs.run({app: 'example'}).then(function() {
        mock_sni.done();
        mock_ssl.done();
        expect(cli.stderr).to.equal('');
        expect(cli.stdout).to.equal(
`Name        Endpoint                  Common Name(s)  Expires               Trusted  Type    
──────────  ────────────────────────  ──────────────  ────────────────────  ───────  ────────
tokyo-1050  tokyo-1050.herokussl.com  example.org     2013-08-01 21:34 UTC  False    Endpoint
akita-7777  akita-7777.herokussl.com  heroku.com      2013-08-01 21:34 UTC  True     Endpoint
`);
      });
    });
  
    it("warns about no SSL Endpoints if the app has no certs", function() {
      let mock_sni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, []);
  
      let mock_ssl = nock('https://api.heroku.com')
      .get('/apps/example/ssl-endpoints')
      .reply(200, []);
  
      return certs.run({app: 'example'}).then(function() {
        mock_sni.done();
        mock_ssl.done();
        expect(cli.stderr).to.equal('');
        expect(cli.stdout).to.equal(`example has no SSL Endpoints.\nUse \`heroku _certs:add CRT KEY\` to add one.\n`);
      });
    });
  });

  it('# shows a mix of certs ordered by name', function() {
    let mock_sni = nock('https://api.heroku.com', {
      reqheaders: {'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert'}
    })
    .get('/apps/example/sni-endpoints')
    .reply(200, [endpoint]);

    let mock_ssl = nock('https://api.heroku.com', {
      reqheaders: {'Accept': 'application/vnd.heroku+json; version=3.ssl_cert'}
    })
    .get('/apps/example/ssl-endpoints')
    .reply(200, [endpoint2]);

    return certs.run({app: 'example'}).then(function() {
      mock_sni.done();
      mock_ssl.done();
      expect(cli.stderr).to.equal('');
      expect(cli.stdout).to.equal(
`Name        Endpoint                  Common Name(s)  Expires               Trusted  Type    
──────────  ────────────────────────  ──────────────  ────────────────────  ───────  ────────
tokyo-1050  tokyo-1050.herokussl.com  example.org     2013-08-01 21:34 UTC  False    SNI     
akita-7777  akita-7777.herokussl.com  heroku.com      2013-08-01 21:34 UTC  True     Endpoint
`);
    });
  });

});
