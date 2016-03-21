'use strict';

let unwrap = require('../../unwrap.js');
let cmd    = commands.find(c => c.topic === 'apps' && c.command === 'rename');

describe('heroku apps:rename', function() {
  beforeEach(() => cli.mockConsole());

  it('renames an app', function() {
    let api = nock('https://api.heroku.com')
    .patch('/apps/myapp', {name: 'newname'})
    .reply(200, {
      name: 'foobar',
      web_url: 'https://foobar.com',
    });

    return cmd.run({app: 'myapp', flags: {}, args: {newname: 'newname'}, httpGitHost: 'git.heroku.com'})
    .then(() => expect(unwrap(cli.stderr)).to.equal(`Renaming myapp to newname... done Don't forget to update git remotes for all other local checkouts of the app.\n`))
    .then(() => expect(cli.stdout).to.equal('https://foobar.com | https://git.heroku.com/foobar.git\n'))
    .then(() => api.done());
  });
});
