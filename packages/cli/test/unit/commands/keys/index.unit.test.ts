import {expect, test} from '@oclif/test'

const PUBLIC_KEY = 'ssh-rsa AAAAB3NzxCXXXXXXXXXXXXXXXXXXXV7iHuYrZxd user@machine'

describe('heroku keys', () => {
  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api.get('/account/keys').reply(200, [])
    })
    .command(['keys'])
    .it('warns if no keys', ({stdout, stderr}) => {
      expect(stdout).to.equal('')
      expect(stderr).to.contain('Warning: You have no SSH keys.\n')
    })

  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .get('/account/keys')
        .reply(200, [
          {email: 'user@example.com', public_key: PUBLIC_KEY},
        ])
    })
    .command(['keys'])
    .it('shows ssh keys', ({stdout, stderr}) => {
      expect(stdout).to.equal(`=== user@example.com keys

ssh-rsa AAAAB3NzxC...V7iHuYrZxd user@machine
`)
      expect(stderr).to.equal('')
    })

  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .get('/account/keys')
        .reply(200, [
          {email: 'user@example.com', public_key: PUBLIC_KEY},
        ])
    })
    .command(['keys', '--json'])
    .it('shows ssh keys as json', ({stdout, stderr}) => {
      expect(JSON.parse(stdout)).to.deep.equal([{email: 'user@example.com', public_key: PUBLIC_KEY}])
      expect(stderr).to.equal('')
    })

  test
    .stderr()
    .stdout()
    .nock('https://api.heroku.com:443', api => {
      api
        .get('/account/keys')
        .reply(200, [
          {email: 'user@example.com', public_key: PUBLIC_KEY},
        ])
    })
    .command(['keys', '--long'])
    .it('shows full SSH keys', ({stdout, stderr}) => {
      expect(stdout).to.equal(`=== user@example.com keys

${PUBLIC_KEY}
`)
      expect(stderr).to.equal('')
    })
})
