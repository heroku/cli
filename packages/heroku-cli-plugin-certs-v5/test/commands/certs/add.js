'use strict';

let expect = require('chai').expect;
let nock   = require('nock');
var fs     = require('fs');
var sinon  = require('sinon');

let proxyquire = require('proxyquire').noCallThru();
let inquirer;
let certs;

let endpoint            = require('../../stubs/sni-endpoints.js').endpoint;
let endpoint_stables    = require('../../stubs/sni-endpoints.js').endpoint_stables;
let endpoint_warning    = require('../../stubs/sni-endpoints.js').endpoint_warning;
let certificate_details = require('../../stubs/sni-endpoints.js').certificate_details;

let error = require('../../../lib/error.js');
let assert_exit = require('../../assert_exit.js');
let unwrap = require('../../unwrap.js');

describe('heroku certs:add', function() {
  beforeEach(function() {
    cli.mockConsole();
    sinon.stub(fs, 'readFile');
    nock.cleanAll();
    error.exit.mock();

    inquirer = {};
    certs = proxyquire('../../../commands/certs/add', {inquirer});
  });

  describe('(ported)', function() {
    it('# adds an SSL endpoint if passed --type endpoint', function() {
      nock('https://api.heroku.com')
      .get('/apps/example/ssl-endpoints')
      .reply(200, []);
  
      fs.readFile
        .withArgs('pem_file', sinon.match.func)
        .callsArgWithAsync(1, null, 'pem content');
      fs.readFile
        .withArgs('key_file', sinon.match.func)
        .callsArgWithAsync(1, null, 'key content');
  
      let mock_ssl = nock('https://api.heroku.com', {
        reqheaders: {'Accept': 'application/vnd.heroku+json; version=3.ssl_cert'}
      })
      .post('/apps/example/ssl-endpoints', {
        certificate_chain: 'pem content', private_key: 'key content'
      })
      .reply(200, endpoint);
  
      return certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {bypass: true, type: 'endpoint'}}).then(function() {
        mock_ssl.done();
        expect(cli.stderr).to.equal('Adding SSL certificate to example... done\n');
        expect(cli.stdout).to.equal(
`example now served by tokyo-1050.herokussl.com
Certificate details:
${certificate_details}
`);
      });
    });
  });

  afterEach(function() {
    fs.readFile.restore();
  });

  it('# posts to ssl doctor', function() {
    nock('https://api.heroku.com')
    .get('/apps/example/domains')
    .reply(200, []);

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

    let mock_ssl = nock('https://api.heroku.com')
    .get('/apps/example/addons/ssl%3Aendpoint')
    .reply(404, {
        "id":"not_found",
        "resource":"addon"
    });

    let mock_sni = nock('https://api.heroku.com')
    .post('/apps/example/sni-endpoints', {
      certificate_chain: 'pem content', private_key: 'key content'
    })
    .reply(200, endpoint);

    return certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {}}).then(function() {
      ssl_doctor.done();
      mock_ssl.done();
      mock_sni.done();
      expect(cli.stderr).to.equal('Resolving trust chain... done\nAdding SSL certificate to example... done\n');
      expect(cli.stdout).to.equal(
`example now served by tokyo-1050.herokussl.com
Certificate details:
${certificate_details}
`);
    });
  });

  it('# propegates ssl doctor errors', function() {
    nock('https://api.heroku.com')
    .get('/apps/example/domains')
    .reply(200, []);

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

    let mock_ssl = nock('https://api.heroku.com')
    .get('/apps/example/addons/ssl%3Aendpoint')
    .reply(404, {
        "id":"not_found",
        "resource":"addon"
    });

    return certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {}})
    .then(function() {
      expect.fail("Expected exception");
    })
    .catch(function(err) {
      mock_ssl.done();
      ssl_doctor.done();
      expect(cli.stdout).to.equal('');
      expect(cli.stderr).to.equal('Resolving trust chain... !!!\n');
      expect(err.message).to.equal("No certificate given is a domain name certificate.");
    });
  });

  it('# bypasses ssl doctor', function() {
    nock('https://api.heroku.com')
    .get('/apps/example/domains')
    .reply(200, []);

    fs.readFile
      .withArgs('pem_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'pem content');
    fs.readFile
      .withArgs('key_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'key content');

    let mock_ssl = nock('https://api.heroku.com')
    .get('/apps/example/addons/ssl%3Aendpoint')
    .reply(404, {
        "id":"not_found",
        "resource":"addon"
    });

    let mock_sni = nock('https://api.heroku.com')
    .post('/apps/example/sni-endpoints', {
      certificate_chain: 'pem content', private_key: 'key content'
    })
    .reply(200, endpoint);

    return certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {bypass: true}}).then(function() {
      mock_sni.done();
      mock_ssl.done();
      expect(cli.stderr).to.equal('Adding SSL certificate to example... done\n');
      expect(cli.stdout).to.equal(
`example now served by tokyo-1050.herokussl.com
Certificate details:
${certificate_details}
`);
    });
  });

  it('# displays warnings', function() {
    nock('https://api.heroku.com')
    .get('/apps/example/domains')
    .reply(200, []);

    fs.readFile
      .withArgs('pem_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'pem content');
    fs.readFile
      .withArgs('key_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'key content');

    let mock_ssl = nock('https://api.heroku.com')
    .get('/apps/example/addons/ssl%3Aendpoint')
    .reply(404, {
        "id":"not_found",
        "resource":"addon"
    });

    let mock_sni = nock('https://api.heroku.com')
    .post('/apps/example/sni-endpoints', {
      certificate_chain: 'pem content', private_key: 'key content'
    })
    .reply(200, endpoint_warning);

    return certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {bypass: true}}).then(function() {
      mock_sni.done();
      mock_ssl.done();
      expect(unwrap(cli.stderr)).to.equal('Adding SSL certificate to example... done WARNING: ssl_cert provides no domain(s) that are configured for this Heroku app\n');
    });
  });

  it('# automatically creates an SNI endpoint if no SSL addon', function() {
    nock('https://api.heroku.com')
    .get('/apps/example/addons/ssl%3Aendpoint')
    .reply(404, {
        "id":"not_found",
        "resource":"addon"
    });

    nock('https://api.heroku.com')
    .get('/apps/example/domains')
    .reply(200, []);

    fs.readFile
      .withArgs('pem_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'pem content');
    fs.readFile
      .withArgs('key_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'key content');

    let mock = nock('https://api.heroku.com')
    .post('/apps/example/sni-endpoints', {
      certificate_chain: 'pem content', private_key: 'key content'
    })
    .reply(200, endpoint);

    return certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {bypass: true}}).then(function() {
      mock.done();
      expect(cli.stderr).to.equal('Adding SSL certificate to example... done\n');
      expect(cli.stdout).to.equal(
`example now served by tokyo-1050.herokussl.com
Certificate details:
${certificate_details}
`);
    });
  });

  describe('stable cnames', function() {
    beforeEach(function() {
      nock('https://api.heroku.com')
      .get('/apps/example/addons/ssl%3Aendpoint')
      .reply(404, {
          "id":"not_found",
          "resource":"addon"
      });
  
      fs.readFile
        .withArgs('pem_file', sinon.match.func)
        .callsArgWithAsync(1, null, 'pem content');
      fs.readFile
        .withArgs('key_file', sinon.match.func)
        .callsArgWithAsync(1, null, 'key content');
    });

    it('# prompts creates an SNI endpoint with stable cnames if no SSL addon', function() {
      let mock = nock('https://api.heroku.com')
      .post('/apps/example/sni-endpoints', {
        certificate_chain: 'pem content', private_key: 'key content'
      })
      .reply(200, endpoint_stables);

      let domains_mock = nock('https://api.heroku.com')
      .get('/apps/example/domains')
      .reply(200, [
        {"kind": "custom", "hostname": "biz.example.com", "cname": "biz.example.com.herokudns.com"},
        {"kind": "custom", "hostname": "baz.example.org", "cname": "baz.example.org.herokudns.com"}
      ]);

      inquirer.prompt = prompts => {
        let choices = prompts[0].choices;
        expect(choices).to.eql([
          {name: 'foo.example.org'},
          {name: 'bar.example.org'}
        ]);
        return Promise.resolve({domains: ['foo.example.org']});
      };

      let domains_create = nock('https://api.heroku.com')
      .post('/apps/example/domains', {hostname: 'foo.example.org'})
      .reply(200, 
        {"kind": "custom", "cname": "foo.example.com.herokudns.org", "hostname": "foo.example.org"}
      );

      return certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {bypass: true}}).then(function() {
        mock.done();
        domains_mock.done();
        domains_create.done();
        expect(unwrap(cli.stderr)).to.equal('Adding SSL certificate to example... done\n\nAdding domain foo.example.org to example... done\n');
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

=== The following common names already have domain entries
biz.example.com

=== The following domains are set up for this certificate
Name        Endpoint                       Common Name(s)   Expires               Trusted  Type
──────────  ─────────────────────────────  ───────────────  ────────────────────  ───────  ────
tokyo-1050  foo.example.com.herokudns.org  foo.example.org  2013-08-01 21:34 UTC  False    SNI 
            (no domains match)             bar.example.org                                     
            biz.example.com.herokudns.com  biz.example.com                                     
`);
      });
    });

    it('# when passed domains does not prompt and creates an SNI endpoint with stable cnames if no SSL addon', function() {
      let mock = nock('https://api.heroku.com')
      .post('/apps/example/sni-endpoints', {
        certificate_chain: 'pem content', private_key: 'key content'
      })
      .reply(200, endpoint_stables);

      let domains_mock = nock('https://api.heroku.com')
      .get('/apps/example/domains')
      .reply(200, [
        {"kind": "custom", "hostname": "baz.example.org", "cname": "baz.example.org.herokudns.com"}
      ]);

      let domains_create_foo = nock('https://api.heroku.com')
      .post('/apps/example/domains', {hostname: 'foo.example.org'})
      .reply(200, 
        {"kind": "custom", "cname": "foo.example.com.herokudns.org", "hostname": "foo.example.org"}
      );

      let domains_create_bar = nock('https://api.heroku.com')
      .post('/apps/example/domains', {hostname: 'bar.example.org'})
      .reply(200, 
        {"kind": "custom", "cname": "bar.example.com.herokudns.org", "hostname": "bar.example.org"}
      );

      return certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {bypass: true, domains: 'foo.example.org,bar.example.org'}}).then(function() {
        mock.done();
        domains_mock.done();
        domains_create_foo.done();
        domains_create_bar.done();
        expect(unwrap(cli.stderr)).to.equal('Adding SSL certificate to example... done\n\nAdding domain foo.example.org to example... done\nAdding domain bar.example.org to example... done\n');
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

=== The following domains are set up for this certificate
Name        Endpoint                       Common Name(s)   Expires               Trusted  Type
──────────  ─────────────────────────────  ───────────────  ────────────────────  ───────  ────
tokyo-1050  foo.example.com.herokudns.org  foo.example.org  2013-08-01 21:34 UTC  False    SNI 
            bar.example.com.herokudns.org  bar.example.org                                     
            (no domains match)             biz.example.com                                     
`);
      });
    });

    it('# when passed existing domains does not prompt and creates an SNI endpoint with stable cnames if no SSL addon', function() {
      let mock = nock('https://api.heroku.com')
      .post('/apps/example/sni-endpoints', {
        certificate_chain: 'pem content', private_key: 'key content'
      })
      .reply(200, endpoint_stables);

      let domains_mock = nock('https://api.heroku.com')
      .get('/apps/example/domains')
      .reply(200, [
        {"kind": "custom", "hostname": "baz.example.org", "cname": "baz.example.org.herokudns.com"},
        {"kind": "custom", "hostname": "foo.example.org", "cname": "foo.example.org.herokudns.com"}
      ]);

      return certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {bypass: true, domains: 'foo.example.org'}}).then(function() {
        mock.done();
        domains_mock.done();
        expect(unwrap(cli.stderr)).to.equal('Adding SSL certificate to example... done\n');
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

=== The following common names already have domain entries
foo.example.org

=== The following domains are set up for this certificate
Name        Endpoint                       Common Name(s)   Expires               Trusted  Type
──────────  ─────────────────────────────  ───────────────  ────────────────────  ───────  ────
tokyo-1050  foo.example.org.herokudns.com  foo.example.org  2013-08-01 21:34 UTC  False    SNI 
            (no domains match)             bar.example.org                                     
            (no domains match)             biz.example.com                                     
`);
      });
    });

    it('# when passed bad domains does not prompt and creates an SNI endpoint with stable cnames if no SSL addon', function() {
      let mock = nock('https://api.heroku.com')
      .post('/apps/example/sni-endpoints', {
        certificate_chain: 'pem content', private_key: 'key content'
      })
      .reply(200, endpoint_stables);

      let domains_mock = nock('https://api.heroku.com')
      .get('/apps/example/domains')
      .reply(200, [
        {"kind": "custom", "hostname": "baz.example.org", "cname": "baz.example.org.herokudns.com"}
      ]);

      return certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {bypass: true, domains: 'garbage.example.org'}}).then(function() {
        mock.done();
        domains_mock.done();
        expect(unwrap(cli.stderr)).to.equal('Adding SSL certificate to example... done WARNING: Not adding garbage.example.org because it is not listed in the certificate\n');
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

=== The following domains are set up for this certificate
Name        Endpoint            Common Name(s)   Expires               Trusted  Type
──────────  ──────────────────  ───────────────  ────────────────────  ───────  ────
tokyo-1050  (no domains match)  foo.example.org  2013-08-01 21:34 UTC  False    SNI 
            (no domains match)  bar.example.org                                     
            (no domains match)  biz.example.com                                     
`);
      });
    });

    it('# does not prompt if all domains covered', function() {
      let mock = nock('https://api.heroku.com')
      .post('/apps/example/sni-endpoints', {
        certificate_chain: 'pem content', private_key: 'key content'
      })
      .reply(200, endpoint_stables);

      let domains_mock = nock('https://api.heroku.com')
      .get('/apps/example/domains')
      .reply(200, [
        {"kind": "custom", "hostname": "foo.example.org", "cname": "foo.example.org.herokudns.com"},
        {"kind": "custom", "hostname": "bar.example.org", "cname": "bar.example.org.herokudns.com"},
        {"kind": "custom", "hostname": "biz.example.com", "cname": "biz.example.com.herokudns.com"},
        {"kind": "custom", "hostname": "baz.example.org", "cname": "baz.example.org.herokudns.com"}
      ]);

      return certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {bypass: true}}).then(function() {
        mock.done();
        domains_mock.done();
        expect(unwrap(cli.stderr)).to.equal('Adding SSL certificate to example... done\n');
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

=== The following common names already have domain entries
foo.example.org
bar.example.org
biz.example.com
`);
      });
    });

    it('# does not prompt if domains covered with wildcard', function() {
      let mock = nock('https://api.heroku.com')
      .post('/apps/example/sni-endpoints', {
        certificate_chain: 'pem content', private_key: 'key content'
      })
      .reply(200, endpoint_stables);

      let domains_mock = nock('https://api.heroku.com')
      .get('/apps/example/domains')
      .reply(200, [
        {"kind": "custom", "hostname": "*.example.org", "cname": "wildcard.example.org.herokudns.com"},
        {"kind": "custom", "hostname": "*.example.com", "cname": "wildcard.example.com.herokudns.com"},
        {"kind": "custom", "hostname": "biz.example.com", "cname": "biz.example.com.herokudns.com"},
      ]);

      return certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {bypass: true}}).then(function() {
        mock.done();
        domains_mock.done();
        expect(unwrap(cli.stderr)).to.equal('Adding SSL certificate to example... done\n');
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

=== The following common names already have domain entries
foo.example.org
bar.example.org
biz.example.com
`);
      });
    });

  });

  it('# errors out if there is an SSL addon and no flags set', function() {
    let mock_addons = nock('https://api.heroku.com')
    .get('/apps/example/addons/ssl%3Aendpoint')
    .reply(200, {});

    return assert_exit(1, certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {bypass: true}})).then(function() {
      mock_addons.done();
      expect(cli.stderr).to.equal(' ▸    Must pass either --type with either \'endpoint\' or \'sni\'\n');
      expect(cli.stdout).to.equal('');
    });
  });

  it('# errors out if type is not known', function() {
    let mock_ssl = nock('https://api.heroku.com')
    .get('/apps/example/addons/ssl%3Aendpoint')
    .reply(200, {});

    return assert_exit(1, certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {bypass: true, type: 'foo'}})).then(function() {
      mock_ssl.done();
      expect(cli.stderr).to.equal(' ▸    Must pass either --type with either \'endpoint\' or \'sni\'\n');
      expect(cli.stdout).to.equal('');
    });
  });

  it('# creates an SNI endpoint if SSL addon and passed --type sni', function() {
    nock('https://api.heroku.com')
    .get('/apps/example/ssl-endpoints')
    .reply(200, []);

    nock('https://api.heroku.com')
    .get('/apps/example/domains')
    .reply(200, []);

    fs.readFile
      .withArgs('pem_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'pem content');
    fs.readFile
      .withArgs('key_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'key content');

    let mock_sni = nock('https://api.heroku.com', {
      reqheaders: {'Accept': 'application/vnd.heroku+json; version=3.sni_ssl_cert'}
    })
    .post('/apps/example/sni-endpoints', {
      certificate_chain: 'pem content', private_key: 'key content'
    })
    .reply(200, endpoint);

    return certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {bypass: true, type: 'sni'}}).then(function() {
      mock_sni.done();
      expect(cli.stderr).to.equal('Adding SSL certificate to example... done\n');
      expect(cli.stdout).to.equal(
`example now served by tokyo-1050.herokussl.com
Certificate details:
${certificate_details}
`);
    });
  });

  it('# creates an SSL certificate if SSL addon and passed --type endpoint', function() {
    nock('https://api.heroku.com')
    .get('/apps/example/ssl-endpoints')
    .reply(200, []);

    fs.readFile
      .withArgs('pem_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'pem content');
    fs.readFile
      .withArgs('key_file', sinon.match.func)
      .callsArgWithAsync(1, null, 'key content');

    let mock_sni = nock('https://api.heroku.com', {
      reqheaders: {'Accept': 'application/vnd.heroku+json; version=3.ssl_cert'}
    })
    .post('/apps/example/ssl-endpoints', {
      certificate_chain: 'pem content', private_key: 'key content'
    })
    .reply(200, endpoint);

    return certs.run({app: 'example', args: {CRT: 'pem_file', KEY: 'key_file'}, flags: {bypass: true, type: 'endpoint'}}).then(function() {
      mock_sni.done();
      expect(cli.stderr).to.equal('Adding SSL certificate to example... done\n');
      expect(cli.stdout).to.equal(
`example now served by tokyo-1050.herokussl.com
Certificate details:
${certificate_details}
`);
    });
  });

});
