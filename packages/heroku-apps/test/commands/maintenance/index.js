'use strict';

// get command from index.js
let cmd = commands.find(c => c.topic === 'maintenance');

describe('maintenance', () => {
  // prevent stdout/stderr from displaying
  // redirects to cli.stdout/cli.stderr instead
  beforeEach(() => cli.mockConsole());

  it('shows the maintenance is on', () => {
    // mock out API
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp')
      .reply(200, {maintenance: true});

    // run the command
    return cmd.run({app: 'myapp'})
    // check stdout
    .then(() => expect(cli.stdout).to.equal('on\n'))
    // check stderr
    .then(() => expect(cli.stderr).to.equal(''))
    // ensure all nock HTTP expectations are met
    .then(() => api.done());
  });

  it('shows the maintenance is off', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp')
      .reply(200, {maintenance: false});
    return cmd.run({app: 'myapp'})
    .then(() => expect(cli.stdout).to.equal('off\n'))
    .then(() => api.done());
  });
});
