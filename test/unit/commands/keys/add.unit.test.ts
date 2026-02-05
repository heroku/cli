import {hux} from '@heroku/heroku-cli-util'
import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import * as fs from 'fs-extra'
import inquirer from 'inquirer'
import nock from 'nock'
import os from 'node:os'
import path from 'node:path'
import sinon from 'sinon'

describe('keys:add', function () {
  const PUBLIC_KEY = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDsAbr7QvJUwDC0dfX3p884w7T06MgJcwbvKDeMpOGg7FXhVSjpXz0SrFrbzbUfs9LtIDIvBPfA5+LTA45+apQTt+A3fiMsKElFjiJgO0ag12vbttHxjda12tmm/Sc0CBpOOeLJxJYboWeN7G4LfW+llUXhb45gNp48qJKbCZKZN2RTd3F8BFUgLedVKg9xs1OyyioFaQJC0N8Ka4CyfTn0mpWnkyrzYvziG1KMELohbP74hAEmW7+/PM9KjXdLeFaOJXTYZLGYJR6DX2Wdd/AP1JFljtXNXlVQ224IPRuwrnVK/KqegY1tk+io4+Ju7mL9PyyXtFOESK+yinzQ3MJn'
  let api: nock.Scope
  let home: string
  let sshDir: string

  beforeEach(async function () {
    // Clean up and recreate directories
    home = path.join('tmp', 'home')
    sshDir = path.join(home, '.ssh')
    await fs.remove(home)
    await fs.ensureDir(sshDir)
    api = nock('https://api.heroku.com')
  })

  afterEach(async function () {
    delete process.env.HEROKU_API_KEY
    await fs.remove(home)
    nock.cleanAll()
    api.done()
    sinon.restore()
  })

  describe('direct key addition', function () {
    it('adds a specified key file', async function () {
      process.env.HEROKU_API_KEY = 'authtoken'

      api
        .post('/account/keys', {public_key: PUBLIC_KEY})
        .reply(200)

      const {stderr, stdout} = await runCommand(['keys:add', path.join('test', 'fixtures', 'id_rsa.pub')])

      expect(stdout).to.equal('')
      expect(stderr).to.contain('Uploading')
      expect(stderr).to.contain('done')
    })
  })

  describe('key generation scenarios', function () {
    it('generates and adds a new key when none exists', async function () {
      process.env.HEROKU_API_KEY = 'authtoken'

      api
        .post('/account/keys')
        .reply(200)

      sinon.stub(os, 'homedir').returns(home)
      sinon.stub(inquirer, 'prompt').resolves({yes: true})
      sinon.stub(hux, 'prompt').resolves('yes')

      const {stderr} = await runCommand(['keys:add', '--quiet'])

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

    it('handles multiple existing keys', async function () {
      process.env.HEROKU_API_KEY = 'authtoken'

      api
        .post('/account/keys', {public_key: PUBLIC_KEY})
        .reply(200)

      sinon.stub(os, 'homedir').returns(home)
      sinon.stub(inquirer, 'prompt').callsFake(function () {
        // eslint-disable-next-line prefer-rest-params
        const choices = arguments[0]
        expect(choices[0].message).to.equal('Which SSH key would you like to upload?')
        return Promise.resolve({key: choices[0].choices[0]})
      })

      // Add second key for multiple key test
      await fs.copy(
        path.join('test', 'fixtures', 'id_rsa.pub'),
        path.join(sshDir, 'id_rsa2.pub'),
      )

      const {stderr} = await runCommand(['keys:add'])

      expect(stderr).to.include('Uploading')
      expect(stderr).to.include('done')
    })
  })
})
