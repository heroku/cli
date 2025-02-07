import {ux} from '@oclif/core'
import {expect, test} from '@oclif/test'
import * as rimraf from 'rimraf'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as inquirer from 'inquirer'
import * as os from 'os'

describe('keys:add', function () {
  const home = path.join('tmp', 'home')
  const sshDir = path.join(home, '.ssh')
  const PATH_TO_HOME_KEY = path.join(sshDir, 'id_rsa.pub')
  const PUBLIC_KEY = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDsAbr7QvJUwDC0dfX3p884w7T06MgJcwbvKDeMpOGg7FXhVSjpXz0SrFrbzbUfs9LtIDIvBPfA5+LTA45+apQTt+A3fiMsKElFjiJgO0ag12vbttHxjda12tmm/Sc0CBpOOeLJxJYboWeN7G4LfW+llUXhb45gNp48qJKbCZKZN2RTd3F8BFUgLedVKg9xs1OyyioFaQJC0N8Ka4CyfTn0mpWnkyrzYvziG1KMELohbP74hAEmW7+/PM9KjXdLeFaOJXTYZLGYJR6DX2Wdd/AP1JFljtXNXlVQ224IPRuwrnVK/KqegY1tk+io4+Ju7mL9PyyXtFOESK+yinzQ3MJn'

  beforeEach(async function () {
    // Clean up and recreate directories
    await fs.remove(home)
    await fs.ensureDir(sshDir)
  })

  afterEach(async function () {
    await fs.remove(home)
  })

  describe('direct key addition', function () {
    test
      .stderr()
      .stdout()
      .nock('https://api.heroku.com:443', api => {
        api
          .post('/account/keys', {public_key: PUBLIC_KEY})
          .reply(200)
      })
      .command(['keys:add', path.join('test', 'fixtures', 'id_rsa.pub')])
      .it('adds a specified key file', ({stderr, stdout}) => {
        expect(stdout).to.equal('')
        expect(stderr).to.contain('Uploading')
        expect(stderr).to.contain('done')
      })
  })

  describe('key generation scenarios', function () {
    test
      .stderr()
      .stdout()
      .nock('https://api.heroku.com:443', api => {
        api.post('/account/keys').reply(200)
      })
      .stub(ux, 'prompt', () => Promise.resolve('yes'))
      .stub(os, 'homedir', () => home)
      .stub(inquirer, 'prompt', () => Promise.resolve({yes: true}))
      .command(['keys:add', '--quiet'])
      .it('generates and adds a new key when none exists', ({stderr}) => {
        expect(stderr).to.include('Could not find an existing SSH key')
        expect(stderr).to.include('done')
      })
  })

  describe('existing key scenarios', function () {
    beforeEach(async function () {
      // Ensure test fixture exists and copy it to the test location
      await fs.copy(
        path.join('test', 'fixtures', 'id_rsa.pub'),
        path.join(sshDir, 'id_rsa.pub'),
      )
    })

    test
      .stderr()
      .stdout()
      .nock('https://api.heroku.com:443', api => {
        api
          .post('/account/keys', {public_key: PUBLIC_KEY})
          .reply(200)
      })
      .stub(os, 'homedir', () => home)
      .stub(inquirer, 'prompt', function () {
        // eslint-disable-next-line prefer-rest-params
        const choices = arguments[0]
        expect(choices[0].message).to.equal('Which SSH key would you like to upload?')
        return Promise.resolve({key: choices[0].choices[0]})
      })
      .do(async () => {
        // Add second key for multiple key test
        await fs.copy(
          path.join('test', 'fixtures', 'id_rsa.pub'),
          path.join(sshDir, 'id_rsa2.pub'),
        )
      })
      .command(['keys:add'])
      .it('handles multiple existing keys', ({stderr}) => {
        expect(stderr).to.include('Uploading')
        expect(stderr).to.include('done')
      })
  })
})
