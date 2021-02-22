'use strict'
/* globals commands describe it beforeEach afterEach */

const nock = require('nock')
const cli = require('heroku-cli-util')
const cmd = commands.find((c) => c.topic === 'keys' && !c.command)
const { expect } = require('chai')
const unwrap = require('../../unwrap')

describe('heroku keys', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('warns if no keys', async () => {
    let api = nock('https://api.heroku.com:443')
      .get('/account/keys').reply(200, [])

    await cmd.run({ flags: {} })

    expect(cli.stdout, 'to be empty');
    expect(unwrap(cli.stderr)).to.equal('You have no SSH keys.\n');

    return api.done()
  })

  it('shows ssh keys', async () => {
    let api = nock('https://api.heroku.com:443')
      .get('/account/keys')
      .reply(200, [
        { email: 'user@example.com', public_key: 'ssh-rsa AAAAB3NzxCXXXXXXXXXXXXXXXXXXXV7iHuYrZxd user@machine' }
      ])

    await cmd.run({ flags: {} })

    expect(cli.stdout).to.equal(`=== user@example.com keys
ssh-rsa AAAAB3NzxC...V7iHuYrZxd user@machine
`);

    expect(cli.stderr, 'to be empty');

    return api.done()
  })

  it('shows ssh keys as json', async () => {
    let api = nock('https://api.heroku.com:443')
      .get('/account/keys')
      .reply(200, [
        { email: 'user@example.com', public_key: 'ssh-rsa AAAAB3NzxCXXXXXXXXXXXXXXXXXXXV7iHuYrZxd user@machine' }
      ])

    await cmd.run({ flags: { json: true } })

    expect(JSON.parse(cli.stdout)[0], 'to satisfy', { email: 'user@example.com' });
    expect(cli.stderr, 'to be empty');

    return api.done()
  })

  it('shows full SSH keys', async () => {
    let api = nock('https://api.heroku.com:443')
      .get('/account/keys')
      .reply(200, [
        { email: 'user@example.com', public_key: 'ssh-rsa AAAAB3NzxCXXXXXXXXXXXXXXXXXXXV7iHuYrZxd user@machine' }
      ])

    await cmd.run({ flags: { long: true } })

    expect(cli.stdout).to.equal(`=== user@example.com keys
ssh-rsa AAAAB3NzxCXXXXXXXXXXXXXXXXXXXV7iHuYrZxd user@machine
`);

    expect(cli.stderr, 'to be empty');

    return api.done()
  })
})
