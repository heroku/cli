import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('heroku keys', function () {
  const PUBLIC_KEY = 'ssh-rsa AAAAB3NzxCXXXXXXXXXXXXXXXXXXXV7iHuYrZxd user@machine'
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('warns if no keys', async function () {
    api
      .get('/account/keys')
      .reply(200, [])

    const {stderr, stdout} = await runCommand(['keys'])

    expect(stdout).to.equal('')
    expect(stderr).to.contain('Warning: You have no SSH keys.\n')
  })

  it('shows ssh keys', async function () {
    api
      .get('/account/keys')
      .reply(200, [
        {email: 'user@example.com', public_key: PUBLIC_KEY},
      ])

    const {stderr, stdout} = await runCommand(['keys'])

    expect(stdout).to.equal(`=== user@example.com keys

ssh-rsa AAAAB3NzxC...V7iHuYrZxd user@machine
`)
    expect(stderr).to.equal('')
  })

  it('shows ssh keys as json', async function () {
    api
      .get('/account/keys')
      .reply(200, [
        {email: 'user@example.com', public_key: PUBLIC_KEY},
      ])

    const {stderr, stdout} = await runCommand(['keys', '--json'])

    expect(JSON.parse(stdout)).to.deep.equal([{email: 'user@example.com', public_key: PUBLIC_KEY}])
    expect(stderr).to.equal('')
  })

  it('shows full SSH keys', async function () {
    api
      .get('/account/keys')
      .reply(200, [
        {email: 'user@example.com', public_key: PUBLIC_KEY},
      ])

    const {stderr, stdout} = await runCommand(['keys', '--long'])

    expect(stdout).to.equal(`=== user@example.com keys

${PUBLIC_KEY}
`)
    expect(stderr).to.equal('')
  })
})
