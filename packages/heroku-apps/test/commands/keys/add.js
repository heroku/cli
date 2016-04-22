'use strict';

let expect     = require('unexpected');
let proxyquire = require('proxyquire');
let util       = require('../../../lib/util');
let bluebird   = require('bluebird');
let fs         = bluebird.promisifyAll(require('fs-extra'));

let home = './tmp/home';
let osHomedir = () => home;
let inquirer = {};
let rimraf = require('rimraf');

let cmd = proxyquire('../../../commands/keys/add', {inquirer, 'os-homedir': osHomedir});

describe('keys:add', () => {
  beforeEach(() => {
    rimraf.sync(home);
    cli.mockConsole();
    return util.mkdirp(home);
  });
  afterEach(() => {
    nock.cleanAll();
    rimraf.sync(home);
  });

  it('adds a given key', () => {
    let api = nock('https://api.heroku.com:443')
      .post('/account/keys', {public_key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDsAbr7QvJUwDC0dfX3p884w7T06MgJcwbvKDeMpOGg7FXhVSjpXz0SrFrbzbUfs9LtIDIvBPfA5+LTA45+apQTt+A3fiMsKElFjiJgO0ag12vbttHxjda12tmm/Sc0CBpOOeLJxJYboWeN7G4LfW+llUXhb45gNp48qJKbCZKZN2RTd3F8BFUgLedVKg9xs1OyyioFaQJC0N8Ka4CyfTn0mpWnkyrzYvziG1KMELohbP74hAEmW7+/PM9KjXdLeFaOJXTYZLGYJR6DX2Wdd/AP1JFljtXNXlVQ224IPRuwrnVK/KqegY1tk+io4+Ju7mL9PyyXtFOESK+yinzQ3MJn\n'})
      .reply(200);

    return cmd.run({args: {key: './test/fixtures/id_rsa.pub'}})
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr, 'to equal', 'Uploading ./test/fixtures/id_rsa.pub SSH key... done\n'))
    .then(() => api.done());
  });

  it('adds a key when prompted to generate one', () => {
    let api = nock('https://api.heroku.com:443')
    .post('/account/keys')
    .reply(200);

    inquirer.prompt = choices => {
      let choice = choices[0];
      if (choice.message === 'Would you like to generate a new one?') return Promise.resolve({yes: true});
      else {
        console.error(choices);
        throw new Error('unexpected choices');
      }
    };

    return cmd.run({args: {}, flags: {quiet: true}})
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr, 'to equal', 'Could not find an existing SSH key at ~/.ssh/id_rsa.pub\nUploading tmp/home/.ssh/id_rsa.pub SSH key... done\n'))
    .then(() => api.done());
  });

  it('adds a key when passed yes', () => {
    let api = nock('https://api.heroku.com:443')
    .post('/account/keys')
    .reply(200);

    inquirer.prompt = () => {
      throw new Error('should not prompt');
    };

    return cmd.run({args: {}, flags: {quiet: true, yes: true}})
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr, 'to equal', 'Could not find an existing SSH key at ~/.ssh/id_rsa.pub\nUploading tmp/home/.ssh/id_rsa.pub SSH key... done\n'))
    .then(() => api.done());
  });

  it('adds a key when prompted to upload one', () => {
    let api = nock('https://api.heroku.com:443')
    .post('/account/keys', {public_key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDsAbr7QvJUwDC0dfX3p884w7T06MgJcwbvKDeMpOGg7FXhVSjpXz0SrFrbzbUfs9LtIDIvBPfA5+LTA45+apQTt+A3fiMsKElFjiJgO0ag12vbttHxjda12tmm/Sc0CBpOOeLJxJYboWeN7G4LfW+llUXhb45gNp48qJKbCZKZN2RTd3F8BFUgLedVKg9xs1OyyioFaQJC0N8Ka4CyfTn0mpWnkyrzYvziG1KMELohbP74hAEmW7+/PM9KjXdLeFaOJXTYZLGYJR6DX2Wdd/AP1JFljtXNXlVQ224IPRuwrnVK/KqegY1tk+io4+Ju7mL9PyyXtFOESK+yinzQ3MJn\n'})
    .reply(200);

    inquirer.prompt = choices => {
      let choice = choices[0];
      if (choice.message === 'Would you like to upload it to Heroku?') return Promise.resolve({yes: true});
      else {
        console.error(choices);
        throw new Error('unexpected choices');
      }
    };

    return fs.copyAsync('./test/fixtures/id_rsa.pub', home+'/.ssh/id_rsa.pub')
    .then(() => cmd.run({args: {}, flags: {}}))
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr, 'to equal', 'Found an SSH public key at tmp/home/.ssh/id_rsa.pub\nUploading tmp/home/.ssh/id_rsa.pub SSH key... done\n'))
    .then(() => api.done());
  });

  it('adds a key when passed yes', () => {
    let api = nock('https://api.heroku.com:443')
    .post('/account/keys', {public_key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDsAbr7QvJUwDC0dfX3p884w7T06MgJcwbvKDeMpOGg7FXhVSjpXz0SrFrbzbUfs9LtIDIvBPfA5+LTA45+apQTt+A3fiMsKElFjiJgO0ag12vbttHxjda12tmm/Sc0CBpOOeLJxJYboWeN7G4LfW+llUXhb45gNp48qJKbCZKZN2RTd3F8BFUgLedVKg9xs1OyyioFaQJC0N8Ka4CyfTn0mpWnkyrzYvziG1KMELohbP74hAEmW7+/PM9KjXdLeFaOJXTYZLGYJR6DX2Wdd/AP1JFljtXNXlVQ224IPRuwrnVK/KqegY1tk+io4+Ju7mL9PyyXtFOESK+yinzQ3MJn\n'})
    .reply(200);

    inquirer.prompt = () => {
      throw new Error('should not prompt');
    };

    return fs.copyAsync('./test/fixtures/id_rsa.pub', home+'/.ssh/id_rsa.pub')
    .then(() => cmd.run({args: {}, flags: {yes: true}}))
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr, 'to equal', 'Found an SSH public key at tmp/home/.ssh/id_rsa.pub\nUploading tmp/home/.ssh/id_rsa.pub SSH key... done\n'))
    .then(() => api.done());
  });

  it('adds a key when prompted to upload multiple', () => {
    let api = nock('https://api.heroku.com:443')
    .post('/account/keys', {public_key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDsAbr7QvJUwDC0dfX3p884w7T06MgJcwbvKDeMpOGg7FXhVSjpXz0SrFrbzbUfs9LtIDIvBPfA5+LTA45+apQTt+A3fiMsKElFjiJgO0ag12vbttHxjda12tmm/Sc0CBpOOeLJxJYboWeN7G4LfW+llUXhb45gNp48qJKbCZKZN2RTd3F8BFUgLedVKg9xs1OyyioFaQJC0N8Ka4CyfTn0mpWnkyrzYvziG1KMELohbP74hAEmW7+/PM9KjXdLeFaOJXTYZLGYJR6DX2Wdd/AP1JFljtXNXlVQ224IPRuwrnVK/KqegY1tk+io4+Ju7mL9PyyXtFOESK+yinzQ3MJn\n'})
    .reply(200);

    inquirer.prompt = choices => {
      let choice = choices[0];
      if (choice.message === 'Which SSH key would you like to upload?') return Promise.resolve({key: choice.choices[0]});
      else {
        console.error(choices);
        throw new Error('unexpected choices');
      }
    };

    return fs.copyAsync('./test/fixtures/id_rsa.pub', home+'/.ssh/id_rsa.pub')
    .then(() => fs.copyAsync('./test/fixtures/id_rsa.pub', home+'/.ssh/id_rsa2.pub'))
    .then(() => cmd.run({args: {}}))
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr, 'to equal', 'Uploading tmp/home/.ssh/id_rsa.pub SSH key... done\n'))
    .then(() => api.done());
  });
});
