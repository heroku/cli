'use strict';

let expect = require('chai').expect;
let nock   = require('nock');
let certs = require('../../../commands/ssl/info.js');
let error  = require('../../../lib/error.js');            

let endpoint            = require('../../stubs/sni-endpoints.js').endpoint;
let certificate_details = require('../../stubs/sni-endpoints.js').certificate_details;

describe('heroku certs:info', function() {
  beforeEach(function() {
    cli.mockConsole();
    error.exit.mock();
  });

  it('allows an endpoint to be specified', function() {
    let mock_info = nock('https://api.heroku.com')
    .get('/apps/example/sni-endpoints/tokyo-1050')
    .reply(200, endpoint);

    return certs.run({app: 'example', args: {name: 'tokyo-1050'}}).then(function() {
      mock_info.done();
      expect(cli.stderr).to.equal('Fetching SSL Endpoint tokyo-1050 info for example...... done\n');
      expect(cli.stdout).to.equal(
`Certificate details:
${certificate_details}
`);
    });
  });

});
