'use strict'
/* globals describe beforeEach afterEach it commands */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('chai').expect
let cmd = commands.find((c) => c.topic === 'apps' && c.command === 'favorites')

describe('apps:favorites:remove', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('shows all favorite apps', async () => {
    let api = nock('https://particleboard.heroku.com:443')
      .get('/favorites?type=app')
      .reply(200, [{ resource_name: 'myapp' }, { resource_name: 'myotherapp' }])

    await cmd.run({ app: 'myapp', flags: { json: false } })

    expect(cli.stdout).to.equal(`=== Favorited Apps
myapp
myotherapp
`);

    expect(cli.stderr).to.equal('');

    return api.done()
  })

  it('shows all favorite apps as json', async () => {
    let api = nock('https://particleboard.heroku.com:443')
      .get('/favorites?type=app')
      .reply(200, [{ resource_name: 'myapp' }, { resource_name: 'myotherapp' }])

    await cmd.run({ app: 'myapp', flags: { json: true } })

    expect(JSON.parse(cli.stdout)[0].resource_name).to.equal('myapp');
    expect(cli.stderr).to.equal('');

    return api.done()
  })
})
