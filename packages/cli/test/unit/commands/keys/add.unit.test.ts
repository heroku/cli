import {ux} from '@oclif/core'
import {expect, test} from '@oclif/test'
import * as rimraf from 'rimraf'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as inquirer from 'inquirer'
import * as os from 'os'

const home = path.join('tmp', 'home')

const PATH_TO_HOME_KEY = path.join('tmp', 'home', '.ssh', 'id_rsa.pub')
const PUBLIC_KEY = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDsAbr7QvJUwDC0dfX3p884w7T06MgJcwbvKDeMpOGg7FXhVSjpXz0SrFrbzbUfs9LtIDIvBPfA5+LTA45+apQTt+A3fiMsKElFjiJgO0ag12vbttHxjda12tmm/Sc0CBpOOeLJxJYboWeN7G4LfW+llUXhb45gNp48qJKbCZKZN2RTd3F8BFUgLedVKg9xs1OyyioFaQJC0N8Ka4CyfTn0mpWnkyrzYvziG1KMELohbP74hAEmW7+/PM9KjXdLeFaOJXTYZLGYJR6DX2Wdd/AP1JFljtXNXlVQ224IPRuwrnVK/KqegY1tk+io4+Ju7mL9PyyXtFOESK+yinzQ3MJn'
const errorOnPrompt = () => {
  throw new Error('should not prompt')
}

describe('keys:add', () => {
  beforeEach(() => {
    rimraf.sync(home)
    fs.mkdirpSync(home)
  })
  afterEach(() => {
    rimraf.sync(home)
  })

  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .post('/account/keys', {public_key: PUBLIC_KEY})
        .reply(200)
    })
    .command(['keys:add', path.join('test', 'fixtures', 'id_rsa.pub')])
    .it('adds a given key', ({stderr, stdout}) => {
      expect(stdout).to.equal('')
      expect(stderr).to.equal(`Uploading ${path.join('test', 'fixtures', 'id_rsa.pub')} SSH key...
Uploading ${path.join('test', 'fixtures', 'id_rsa.pub')} SSH key... done
`)
    })

  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .post('/account/keys')
        .reply(200)
    })
    .stub(ux, 'prompt', () => Promise.resolve('yes'))
    .stub(os, 'homedir', () => home)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .stub(inquirer, 'prompt', choices => {
      const choice = choices[0]
      if (choice.message === 'Would you like to generate a new one?') {
        return Promise.resolve({yes: true})
      }

      console.error(choices)
      throw new Error('unexpected choices')
    })
    .command(['keys:add', '--quiet'])
    .it('adds a key when prompted to generate one', ({stderr, stdout}) => {
      expect(stdout).to.equal('')
      expect(stderr).to.equal(`Could not find an existing SSH key at ${path.join('~', '.ssh', 'id_rsa.pub')}
Uploading ${PATH_TO_HOME_KEY} SSH key...
Uploading ${PATH_TO_HOME_KEY} SSH key... done
`)
    })

  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .post('/account/keys')
        .reply(200)
    })
    .stub(ux, 'prompt', errorOnPrompt)
    .stub(os, 'homedir', () => home)
    .stub(inquirer, 'prompt', errorOnPrompt)
    .command(['keys:add', '--quiet', '--yes'])
    .it('adds a key when passed yes', ({stderr, stdout}) => {
      expect(stdout).to.equal('')
      expect(stderr).to.equal(`Could not find an existing SSH key at ${path.join('~', '.ssh', 'id_rsa.pub')}
Uploading ${PATH_TO_HOME_KEY} SSH key...
Uploading ${PATH_TO_HOME_KEY} SSH key... done
`)
    })

  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .post('/account/keys', {public_key: PUBLIC_KEY})
        .reply(200)
    })
    .stub(ux, 'prompt', () => Promise.resolve('yes'))
    .stub(os, 'homedir', () => home)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .stub(inquirer, 'prompt', choices => {
      const choice = choices[0]
      if (choice.message === 'Would you like to upload it to Heroku?') {
        return Promise.resolve({yes: true})
      }

      console.error(choices)
      throw new Error('unexpected choices')
    })
    .do(async () => {
      await fs.copy(path.join('.', 'test', 'fixtures', 'id_rsa.pub'), path.join(home, '.ssh', 'id_rsa.pub'))
    })
    .command(['keys:add'])
    .it('adds a key when prompted to upload one', ({stderr, stdout}) => {
      expect(stdout).to.equal('')
      expect(stderr).to.equal(`Found an SSH public key at ${path.join('tmp', 'home', '.ssh', 'id_rsa.pub')}
Uploading ${PATH_TO_HOME_KEY} SSH key...
Uploading ${PATH_TO_HOME_KEY} SSH key... done
`)
    })

  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .post('/account/keys', {public_key: PUBLIC_KEY})
        .reply(200)
    })
    .stub(ux, 'prompt', errorOnPrompt)
    .stub(os, 'homedir', () => home)
    .stub(inquirer, 'prompt', errorOnPrompt)
    .do(async () => {
      await fs.copy(path.join('.', 'test', 'fixtures', 'id_rsa.pub'), path.join(home, '.ssh', 'id_rsa.pub'))
    })
    .command(['keys:add', '--yes'])
    .it('adds a key when passed yes and has key', ({stderr, stdout}) => {
      expect(stdout).to.equal('')
      expect(stderr).to.equal(`Found an SSH public key at ${path.join('tmp', 'home', '.ssh', 'id_rsa.pub')}
Uploading ${PATH_TO_HOME_KEY} SSH key...
Uploading ${PATH_TO_HOME_KEY} SSH key... done
`)
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .stub(inquirer, 'prompt', choices => {
      const choice = choices[0]
      if (choice.message === 'Which SSH key would you like to upload?') {
        return Promise.resolve({key: choice.choices[0]})
      }

      console.error(choices)
      throw new Error('unexpected choices')
    })
    .do(async () => {
      await fs.copy(path.join('test', 'fixtures', 'id_rsa.pub'), path.join(home, '.ssh', 'id_rsa.pub'))
      await fs.copy(path.join('test', 'fixtures', 'id_rsa.pub'), path.join(home, '.ssh', 'id_rsa2.pub'))
    })
    .command(['keys:add'])
    .it('adds a key when prompted to upload multiple', ({stderr, stdout}) => {
      expect(stdout).to.equal('')
      expect(stderr).to.equal(`Uploading ${PATH_TO_HOME_KEY} SSH key...
Uploading ${PATH_TO_HOME_KEY} SSH key... done
`)
    })
})
