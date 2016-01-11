'use strict';

let expect = require('chai').expect;
let nock   = require('nock');
let certs = require('../../../commands/sni/remove.js');
let error  = require('../../../lib/error.js');            

let endpoint            = require('../../stubs/sni-endpoints.js').endpoint;

describe('heroku certs:remove', function() {
  beforeEach(function() {
    cli.mockConsole();
    error.exit.mock();
  });

  it('# allows an endpoint to be specified', function() {
    let mock_info = nock('https://api.heroku.com')
    .delete('/apps/example/sni-endpoints/tokyo-1050')
    .reply(200, endpoint);

    return certs.run({app: 'example', args: {name: 'tokyo-1050'}, flags: {confirm: 'example'}}).then(function() {
      mock_info.done();
      expect(cli.stderr).to.equal('');
      expect(cli.stdout).to.equal(
`Removing SSL Endpoint tokyo-1050 from example...
NOTE: Billing is still active. Remove SSL Endpoint add-on to stop billing.
`);
    });
  });

  it('# requires confirmation', function() {
    let mock_list = nock('https://api.heroku.com')
    .get('/apps/example/sni-endpoints')
    .reply(200, [endpoint]);

    certs.run({app: 'example', flags: {confirm: 'notexample'}}).catch(function() {
      mock_list.done();
      expect(cli.stdout).to.equal('');
      expect(cli.stderr).to.equal(
`WARNING: Potentially Destructive Action
This command will remove the endpoint tokyo-1050.herokussl.com from example.
`);
    });
  });

});
