'use strict';

let cmd = commands.find(c => c.topic === 'stack' && !c.command);

describe('stack', function() {
  beforeEach(() => cli.mockConsole());

  it('show available stacks', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp').reply(200, {name: 'myapp', stack: {name: 'cedar-14'}})
      .get('/stacks')
      .reply(200, [
        {name: 'cedar'},
        {name: 'cedar-14'},
      ]);
    return cmd.run({app: 'myapp', flags: {}})
    .then(() => expect(cli.stdout).to.equal(`=== myapp Available Stacks
  cedar-10
* cedar-14
`))
    .then(() => expect(cli.stderr).to.equal(''))
    .then(() => api.done());
  });
});
