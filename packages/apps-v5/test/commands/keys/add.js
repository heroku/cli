'use strict'
/* globals beforeEach afterEach */

const cli = require('heroku-cli-util')
const nock = require('nock')
const {expect} = require('chai')
const proxyquire = require('proxyquire')
const rimraf = require('rimraf')
const fs = require('fs-extra')
const path = require('path')
const home = path.join('tmp', 'home')

let osHomedir
let inquirer
let mockCli
let cmd

describe('keys:add', () => {
  beforeEach(() => {
    osHomedir = () => home
    inquirer = {}
    mockCli = Object.assign({}, cli)

    cmd = proxyquire('../../../src/commands/keys/add', {
      'heroku-cli-util': mockCli,
      os: {homedir: osHomedir},
      inquirer,
    })

    rimraf.sync(home)
    cli.mockConsole()
    return fs.mkdirp(home)
  })
  afterEach(() => {
    nock.cleanAll()
    rimraf.sync(home)
  })

  it('adds a given key', () => {
    let api = nock('https://api.heroku.com:443')
    .post('/account/keys', {public_key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDsAbr7QvJUwDC0dfX3p884w7T06MgJcwbvKDeMpOGg7FXhVSjpXz0SrFrbzbUfs9LtIDIvBPfA5+LTA45+apQTt+A3fiMsKElFjiJgO0ag12vbttHxjda12tmm/Sc0CBpOOeLJxJYboWeN7G4LfW+llUXhb45gNp48qJKbCZKZN2RTd3F8BFUgLedVKg9xs1OyyioFaQJC0N8Ka4CyfTn0mpWnkyrzYvziG1KMELohbP74hAEmW7+/PM9KjXdLeFaOJXTYZLGYJR6DX2Wdd/AP1JFljtXNXlVQ224IPRuwrnVK/KqegY1tk+io4+Ju7mL9PyyXtFOESK+yinzQ3MJn'})
    .reply(200)

    return cmd.run({args: {key: path.join('test', 'fixtures', 'id_rsa.pub')}})
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr).to.equal(`Uploading ${path.join('.', 'test', 'fixtures', 'id_rsa.pub')} SSH key... done
`))
    .then(() => api.done())
  })

  it('adds a key when prompted to generate one', () => {
    let api = nock('https://api.heroku.com:443')
    .post('/account/keys')
    .reply(200)

    inquirer.prompt = choices => {
      let choice = choices[0]
      if (choice.message === 'Would you like to generate a new one?') {
        return Promise.resolve({yes: true})
      // eslint-disable-next-line no-else-return
      } else {
        console.error(choices)
        throw new Error('unexpected choices')
      }
    }

    mockCli.prompt = () => {
      return Promise.resolve('yes')
    }

    return cmd.run({args: {}, flags: {quiet: true}})
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr).to.equal(`Could not find an existing SSH key at ${path.join('~', '.ssh', 'id_rsa.pub')}
Uploading ${path.join('tmp', 'home', '.ssh', 'id_rsa.pub')} SSH key... done
`))
    .then(() => api.done())
  })

  it('adds a key when passed yes', () => {
    let api = nock('https://api.heroku.com:443')
    .post('/account/keys')
    .reply(200)

    inquirer.prompt = () => {
      throw new Error('should not prompt')
    }

    mockCli.prompt = () => {
      throw new Error('should not prompt')
    }

    return cmd.run({args: {}, flags: {quiet: true, yes: true}})
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr).to.equal(`Could not find an existing SSH key at ${path.join('~', '.ssh', 'id_rsa.pub')}
Uploading ${path.join('tmp', 'home', '.ssh', 'id_rsa.pub')} SSH key... done
`))
    .then(() => api.done())
  })

  it('adds a key when prompted to upload one', () => {
    let api = nock('https://api.heroku.com:443')
    .post('/account/keys', {public_key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDsAbr7QvJUwDC0dfX3p884w7T06MgJcwbvKDeMpOGg7FXhVSjpXz0SrFrbzbUfs9LtIDIvBPfA5+LTA45+apQTt+A3fiMsKElFjiJgO0ag12vbttHxjda12tmm/Sc0CBpOOeLJxJYboWeN7G4LfW+llUXhb45gNp48qJKbCZKZN2RTd3F8BFUgLedVKg9xs1OyyioFaQJC0N8Ka4CyfTn0mpWnkyrzYvziG1KMELohbP74hAEmW7+/PM9KjXdLeFaOJXTYZLGYJR6DX2Wdd/AP1JFljtXNXlVQ224IPRuwrnVK/KqegY1tk+io4+Ju7mL9PyyXtFOESK+yinzQ3MJn'})
    .reply(200)

    inquirer.prompt = choices => {
      let choice = choices[0]
      if (choice.message === 'Would you like to upload it to Heroku?') {
        return Promise.resolve({yes: true})
      // eslint-disable-next-line no-else-return
      } else {
        console.error(choices)
        throw new Error('unexpected choices')
      }
    }

    mockCli.prompt = () => {
      return Promise.resolve('yes')
    }

    return fs.copy('./test/fixtures/id_rsa.pub', home + '/.ssh/id_rsa.pub')
    .then(() => cmd.run({args: {}, flags: {}}))
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr).to.equal(`Found an SSH public key at ${path.join('tmp', 'home', '.ssh', 'id_rsa.pub')}
Uploading ${path.join('tmp', 'home', '.ssh/id_rsa.pub')} SSH key... done
`))
    .then(() => api.done())
  })

  it('adds a key when passed yes and has key', () => {
    let api = nock('https://api.heroku.com:443')
    .post('/account/keys', {public_key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDsAbr7QvJUwDC0dfX3p884w7T06MgJcwbvKDeMpOGg7FXhVSjpXz0SrFrbzbUfs9LtIDIvBPfA5+LTA45+apQTt+A3fiMsKElFjiJgO0ag12vbttHxjda12tmm/Sc0CBpOOeLJxJYboWeN7G4LfW+llUXhb45gNp48qJKbCZKZN2RTd3F8BFUgLedVKg9xs1OyyioFaQJC0N8Ka4CyfTn0mpWnkyrzYvziG1KMELohbP74hAEmW7+/PM9KjXdLeFaOJXTYZLGYJR6DX2Wdd/AP1JFljtXNXlVQ224IPRuwrnVK/KqegY1tk+io4+Ju7mL9PyyXtFOESK+yinzQ3MJn'})
    .reply(200)

    inquirer.prompt = () => {
      throw new Error('should not prompt')
    }

    mockCli.prompt = () => {
      throw new Error('should not prompt')
    }

    return fs.copy('./test/fixtures/id_rsa.pub', home + '/.ssh/id_rsa.pub')
    .then(() => cmd.run({args: {}, flags: {yes: true}}))
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr).to.equal(`Found an SSH public key at ${path.join('tmp', 'home', '.ssh', 'id_rsa.pub')}
Uploading ${path.join('tmp', 'home', '.ssh', 'id_rsa.pub')} SSH key... done
`))
    .then(() => api.done())
  })

  it('adds a key when prompted to upload multiple', () => {
    let api = nock('https://api.heroku.com:443')
    .post('/account/keys', {public_key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDsAbr7QvJUwDC0dfX3p884w7T06MgJcwbvKDeMpOGg7FXhVSjpXz0SrFrbzbUfs9LtIDIvBPfA5+LTA45+apQTt+A3fiMsKElFjiJgO0ag12vbttHxjda12tmm/Sc0CBpOOeLJxJYboWeN7G4LfW+llUXhb45gNp48qJKbCZKZN2RTd3F8BFUgLedVKg9xs1OyyioFaQJC0N8Ka4CyfTn0mpWnkyrzYvziG1KMELohbP74hAEmW7+/PM9KjXdLeFaOJXTYZLGYJR6DX2Wdd/AP1JFljtXNXlVQ224IPRuwrnVK/KqegY1tk+io4+Ju7mL9PyyXtFOESK+yinzQ3MJn'})
    .reply(200)

    inquirer.prompt = choices => {
      let choice = choices[0]
      if (choice.message === 'Which SSH key would you like to upload?') {
        return Promise.resolve({key: choice.choices[0]})
      } else {
        console.error(choices)
        throw new Error('unexpected choices')
      }
    }

    return fs.copy(path.join('test', 'fixtures', 'id_rsa.pub'), path.join(home, '.ssh', 'id_rsa.pub'))
    .then(() => fs.copy(path.join('test', 'fixtures', 'id_rsa.pub'), path.join(home, '.ssh', 'id_rsa2.pub')))
    .then(() => cmd.run({args: {}}))
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr).to.equal(`Uploading ${path.join('tmp', 'home', '.ssh', 'id_rsa.pub')} SSH key... done
`))
    .then(() => api.done())
  })
})
