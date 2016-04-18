'use strict';

let cmd = commands.find(c => c.topic === 'keys' && c.command === 'add');

describe('keys:add', () => {
  beforeEach(() => cli.mockConsole());

  it('adds a given key', function() {
    let api = nock('https://api.heroku.com:443')
      .post('/account/keys', {public_key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDsAbr7QvJUwDC0dfX3p884w7T06MgJcwbvKDeMpOGg7FXhVSjpXz0SrFrbzbUfs9LtIDIvBPfA5+LTA45+apQTt+A3fiMsKElFjiJgO0ag12vbttHxjda12tmm/Sc0CBpOOeLJxJYboWeN7G4LfW+llUXhb45gNp48qJKbCZKZN2RTd3F8BFUgLedVKg9xs1OyyioFaQJC0N8Ka4CyfTn0mpWnkyrzYvziG1KMELohbP74hAEmW7+/PM9KjXdLeFaOJXTYZLGYJR6DX2Wdd/AP1JFljtXNXlVQ224IPRuwrnVK/KqegY1tk+io4+Ju7mL9PyyXtFOESK+yinzQ3MJn\n'})
      .reply(200);

    return cmd.run({args: {key: './test/fixtures/id_rsa.pub'}})
    .then(() => expect(cli.stdout).to.equal(''))
    .then(() => expect(cli.stderr).to.equal('Uploading ./test/fixtures/id_rsa.pub ssh key... done\n'))
    .then(() => api.done());
  });
});
