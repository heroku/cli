'use strict';

let cmd = commands.find(c => c.topic === 'features' && !c.command);

describe('features', function() {
  beforeEach(() => cli.mockConsole());

  it('shows the app features', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/features')
      .reply(200, [
        {enabled: true, state: 'general', name: 'feature a', description: 'an app feature'},
      ]);
    return cmd.run({app: 'myapp', flags: {}})
    .then(() => expect(cli.stderr).to.equal(''))
    .then(() => expect(cli.stdout).to.equal(`=== App Features myapp
[+] feature a  an app feature
`))
    .then(() => api.done());
  });
});
