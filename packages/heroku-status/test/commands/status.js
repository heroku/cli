'use strict';

let cmd    = require('../../commands/status');
let moment = require('moment');
let time   = moment().subtract(5, 'minutes');

describe('heroku status', () => {
  beforeEach(() => cli.mockConsole());
  afterEach(() => nock.cleanAll());

  context('when heroku is green', () => {
    it('shows success message', () => {
      let api = nock('https://status.heroku.com:443')
      .get('/api/v3/current-status')
      .reply(200, {status: {Production:"green", Development:"green"}, issues:[]});

      return cmd.run({flags: {}})
      .then(() => {
        expect(`Production:   No known issues at this time.
Development:  No known issues at this time.
`).to.eq(cli.stdout);
      })
      .then(() => api.done());
    });
  });

  context('when heroku has issues', () => {
    it('shows the issues', () => {
      let api = nock('https://status.heroku.com:443')
      .get('/api/v3/current-status')
      .reply(200, {status: {Production:"red", Development:"green"}, issues: [
        {title: 'incident title', created_at: time.toISOString(), full_url: 'https://status.heroku.com', updates: [
          {update_type: 'update type', updated_at: time.toISOString(), contents: 'update contents'}
        ]}
      ]});

      return cmd.run({flags: {}})
      .then(() => {
        expect(`Production:   Red
Development:  No known issues at this time.

=== incident title ${moment(time).format('LT')} https://status.heroku.com
update type  ${moment(time).format('LT')} (5 minutes ago)
update contents

`).to.eq(cli.stdout);
      })
      .then(() => api.done());
    });
  });
});
