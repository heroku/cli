'use strict'
/* globals describe beforeEach it commands */

const expect = require('chai').expect
const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = commands.find((c) => c.topic === 'stack' && c.command === 'set')

const pendingUpgradeApp = {
  name: 'myapp',
  stack: {
    name: 'heroku-16'
  },
  build_stack: {
    name: 'heroku-20'
  }
}

const completedUpgradeApp = {
  name: 'myapp',
  stack: {
    name: 'heroku-20'
  },
  build_stack: {
    name: 'heroku-20'
  }
}

describe('stack:set', function () {
  beforeEach(() => cli.mockConsole())

  it('sets the stack', async function() {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp', { build_stack: 'heroku-20' })
      .reply(200, pendingUpgradeApp)

    await cmd.run({ app: 'myapp', args: { stack: 'heroku-20' }, flags: {} })

    expect(cli.stderr).to.equal('Setting stack to heroku-20... done\n');

    expect(cli.stdout).to.equal(`You will need to redeploy myapp for the change to take effect.
Run git push heroku main to create a new release on myapp.
`);

    return api.done()
  })

  it('sets the stack on a different remote', async function() {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp', { build_stack: 'heroku-20' })
      .reply(200, pendingUpgradeApp)

    await cmd.run({ app: 'myapp', args: { stack: 'heroku-20' }, flags: { remote: 'staging' } })

    expect(cli.stderr).to.equal('Setting stack to heroku-20... done\n');

    expect(cli.stdout).to.equal(`You will need to redeploy myapp for the change to take effect.
Run git push staging main to create a new release on myapp.
`);

    return api.done()
  })

  it('does not show the redeploy message if the stack was immediately updated by API', async function() {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp', { build_stack: 'heroku-20' })
      .reply(200, completedUpgradeApp)

    await cmd.run({ app: 'myapp', args: { stack: 'heroku-20' }, flags: {} })

    expect(cli.stderr).to.equal('Setting stack to heroku-20... done\n');
    expect(cli.stdout).to.equal('');

    return api.done()
  })
})
