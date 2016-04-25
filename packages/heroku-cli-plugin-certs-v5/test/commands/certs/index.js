'use strict';

let expect = require('chai').expect;
let nock   = require('nock');
let certs = require('../../../commands/certs/index.js');

let endpoint            = require('../../stubs/sni-endpoints.js').endpoint;
let endpoint2           = require('../../stubs/sni-endpoints.js').endpoint2;
let endpoint_stables    = require('../../stubs/sni-endpoints.js').endpoint_stables;
let endpoint_wildcard   = require('../../stubs/sni-endpoints.js').endpoint_wildcard;

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

      let mock_domains = nock('https://api.heroku.com')
      .get('/apps/example/domains')
      .reply(200, []);
  
      return certs.run({app: 'example'}).then(function() {
        mock_sni.done();
        mock_ssl.done();
        mock_domains.done();
        expect(cli.stderr).to.equal('');
        expect(cli.stdout).to.equal(
`Name        Endpoint                  Common Name(s)  Expires               Trusted  Type    
──────────  ────────────────────────  ──────────────  ────────────────────  ───────  ────────
tokyo-1050  tokyo-1050.herokussl.com  example.org     2013-08-01 21:34 UTC  False    Endpoint
akita-7777  akita-7777.herokussl.com  heroku.com      2013-08-01 21:34 UTC  True     Endpoint
`);
      });
    });
  
    it("warns about no SSL certificates if the app has no certs", function() {
      let mock_sni = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, []);
  
      let mock_ssl = nock('https://api.heroku.com')
      .get('/apps/example/ssl-endpoints')
      .reply(200, []);

      let mock_domains = nock('https://api.heroku.com')
      .get('/apps/example/domains')
      .reply(200, []);
 
      return certs.run({app: 'example'}).then(function() {
        mock_sni.done();
        mock_ssl.done();
        mock_domains.done();
        expect(cli.stderr).to.equal('');
        expect(cli.stdout).to.equal(`example has no SSL certificates.\nUse \`heroku _certs:add CRT KEY\` to add one.\n`);
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

    let mock_domains = nock('https://api.heroku.com')
    .get('/apps/example/domains')
    .reply(200, []);
  
    return certs.run({app: 'example'}).then(function() {
      mock_sni.done();
      mock_ssl.done();
      mock_domains.done();
      expect(cli.stderr).to.equal('');
      expect(cli.stdout).to.equal(
`Name        Endpoint                  Common Name(s)  Expires               Trusted  Type    
──────────  ────────────────────────  ──────────────  ────────────────────  ───────  ────────
tokyo-1050  tokyo-1050.herokussl.com  example.org     2013-08-01 21:34 UTC  False    SNI     
akita-7777  akita-7777.herokussl.com  heroku.com      2013-08-01 21:34 UTC  True     Endpoint
`);
    });
  });

  it('# shows certs with common names stacked and stable matches', function() {
    let mock_sni = nock('https://api.heroku.com', {
      reqheaders: {'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert'}
    })
    .get('/apps/example/sni-endpoints')
    .reply(200, [endpoint_stables]);

    let mock_ssl = nock('https://api.heroku.com', {
      reqheaders: {'Accept': 'application/vnd.heroku+json; version=3.ssl_cert'}
    })
    .get('/apps/example/ssl-endpoints')
    .reply(200, []);

    let mock_domains = nock('https://api.heroku.com')
    .get('/apps/example/domains')
    .reply(200, [
      {'kind': 'custom', 'hostname': '*.other.org', 'cname': 'wildcard.other.org.herokudns.com'},
      {'kind': 'custom', 'hostname': '*.example.org', 'cname': 'wildcard.example.org.herokudns.com'},
      {'kind': 'custom', 'hostname': 'foo.example.org', 'cname': 'foo.example.org.herokudns.com'}
    ]);

    return certs.run({app: 'example'}).then(function() {
      mock_sni.done();
      mock_ssl.done();
      mock_domains.done();
      expect(cli.stderr).to.equal('');
      expect(cli.stdout).to.equal(
`Name        Endpoint                            Common Name(s)   Expires               Trusted  Type
──────────  ──────────────────────────────────  ───────────────  ────────────────────  ───────  ────
tokyo-1050  foo.example.org.herokudns.com       foo.example.org  2013-08-01 21:34 UTC  False    SNI 
            wildcard.example.org.herokudns.com  bar.example.org                                     
            (no domains match)                  biz.example.com                                     
`);
    });
  });

  it('# shows certs with common names stacked and stable matches wildcard', function() {
    let mock_sni = nock('https://api.heroku.com', {
      reqheaders: {'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert'}
    })
    .get('/apps/example/sni-endpoints')
    .reply(200, [endpoint_wildcard]);

    let mock_ssl = nock('https://api.heroku.com', {
      reqheaders: {'Accept': 'application/vnd.heroku+json; version=3.ssl_cert'}
    })
    .get('/apps/example/ssl-endpoints')
    .reply(200, []);

    let mock_domains = nock('https://api.heroku.com')
    .get('/apps/example/domains')
    .reply(200, [
      {'kind': 'custom', 'hostname': '*.example.org', 'cname': 'wildcard.example.org.herokudns.com'},
      {'kind': 'custom', 'hostname': 'foo.example.org', 'cname': 'foo.example.org.herokudns.com'}
    ]);

    return certs.run({app: 'example'}).then(function() {
      mock_sni.done();
      mock_ssl.done();
      mock_domains.done();
      expect(cli.stderr).to.equal('');
      expect(cli.stdout).to.equal(
`Name        Endpoint                            Common Name(s)  Expires               Trusted  Type
──────────  ──────────────────────────────────  ──────────────  ────────────────────  ───────  ────
tokyo-1050  wildcard.example.org.herokudns.com  *.example.org   2013-08-01 21:34 UTC  False    SNI 
`);
    });
  });

});
