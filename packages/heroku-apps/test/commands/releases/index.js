'use strict';

let nock   = require('nock');
let cmd    = require('../../../commands/releases');
let expect = require('chai').expect;

describe('releases', function() {
  beforeEach(() => cli.mockConsole());

  it('shows releases', function() {
    process.stdout.columns = 80;
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [
        {
          "created_at": "2015-11-18T01:37:41Z",
          "description": "Set foo config vars",
          "id": "5efa3510-e8df-4db0-a176-83ff8ad91eb5",
          "slug": {
            "id": "37994c83-39a3-4cbf-b318-8f9dc648f701"
          },
          "updated_at": "2015-11-18T01:37:41Z",
          "user": {
            "email": "jeff@heroku.com",
            "id": "5985f8c9-a63f-42a2-bec7-40b875bb986f"
          },
          "version": 40
        },
        {
          "created_at": "2015-11-18T01:36:38Z",
          "description": "Remove AWS_SECRET_ACCESS_KEY config vars",
          "id": "7be47426-2c1b-4e4d-b6e5-77c79169aa41",
          "slug": {
            "id": "37994c83-39a3-4cbf-b318-8f9dc648f701"
          },
          "updated_at": "2015-11-18T01:36:38Z",
          "user": {
            "email": "jeff@heroku.com",
            "id": "5985f8c9-a63f-42a2-bec7-40b875bb986f"
          },
          "version": 39
        }
      ]);
    return cmd.run({app: 'myapp', flags: {}})
    .then(() => expect(cli.stdout).to.equal(`=== myapp Releases
v40  Set foo config vars   jeff@heroku.com  2015/11/18 01:37:41 +0000
v39  Remove AWS_SECRET_A…  jeff@heroku.com  2015/11/18 01:36:38 +0000
`))
    .then(() => api.done());
  });
});
