import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

const PUBLIC_KEY = 'ssh-rsa AAAAB3NzxCXXXXXXXXXXXXXXXXXXXV7iHuYrZxd user@machine'

describe('heroku keys', function () {
  afterEach(() => nock.cleanAll())

  it('warns if no keys', async () => {
    nock('https://api.heroku.com:443')
      .get('/account/keys')
      .reply(200, [])

    const {stdout, stderr} = await runCommand(['keys'])

    expect(stdout).to.equal('')
    expect(stderr).to.contain('Warning: You have no SSH keys.\n')
  })

  it('shows ssh keys', async () => {
    nock('https://api.heroku.com:443')
      .get('/account/keys')
      .reply(200, [
        {email: 'user@example.com', public_key: PUBLIC_KEY},
      ])

    const {stdout, stderr} = await runCommand(['keys'])

    expect(stdout).to.equal(`=== user@example.com keys

ssh-rsa AAAAB3NzxC...V7iHuYrZxd user@machine
`)
    expect(stderr).to.equal('')
  })

  it('shows ssh keys as json', async () => {
    nock('https://api.heroku.com:443')
      .get('/account/keys')
      .reply(200, [
        {email: 'user@example.com', public_key: PUBLIC_KEY},
      ])

    const {stdout, stderr} = await runCommand(['keys', '--json'])

    expect(JSON.parse(stdout)).to.deep.equal([{email: 'user@example.com', public_key: PUBLIC_KEY}])
    expect(stderr).to.equal('')
  })

  it('shows full SSH keys', async () => {
    nock('https://api.heroku.com:443')
      .get('/account/keys')
      .reply(200, [
        {email: 'user@example.com', public_key: PUBLIC_KEY},
      ])

    const {stdout, stderr} = await runCommand(['keys', '--long'])

    expect(stdout).to.equal(`=== user@example.com keys

${PUBLIC_KEY}
`)
    expect(stderr).to.equal('')
  })
})
