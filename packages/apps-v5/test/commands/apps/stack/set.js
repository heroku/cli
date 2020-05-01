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
    name: 'heroku-18'
  }
}

const completedUpgradeApp = {
  name: 'myapp',
  stack: {
    name: 'heroku-18'
  },
  build_stack: {
    name: 'heroku-18'
  }
}

describe('stack:set', function () {
  beforeEach(() => cli.mockConsole())

  it('sets the stack', function () {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp', { build_stack: 'heroku-18' })
      .reply(200, pendingUpgradeApp)

    return cmd.run({ app: 'myapp', args: { stack: 'heroku-18' }, flags: {} })
      .then(() => expect(cli.stderr).to.equal('Setting stack to heroku-18... done\n'))
      .then(() => expect(cli.stdout).to.equal(`You will need to redeploy myapp for the change to take effect.
Run git push heroku master to create a new release on myapp.
`))
      .then(() => api.done())
  })

  it('sets the stack on a different remote', function () {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp', { build_stack: 'heroku-18' })
      .reply(200, pendingUpgradeApp)

    return cmd.run({ app: 'myapp', args: { stack: 'heroku-18' }, flags: { remote: 'staging' } })
      .then(() => expect(cli.stderr).to.equal('Setting stack to heroku-18... done\n'))
      .then(() => expect(cli.stdout).to.equal(`You will need to redeploy myapp for the change to take effect.
Run git push staging master to create a new release on myapp.
`))
      .then(() => api.done())
  })

  it('does not show the redeploy message if the stack was immediately updated by API', function () {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp', { build_stack: 'heroku-18' })
      .reply(200, completedUpgradeApp)

    return cmd.run({ app: 'myapp', args: { stack: 'heroku-18' }, flags: {} })
      .then(() => expect(cli.stderr).to.equal('Setting stack to heroku-18... done\n'))
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => api.done())
  })
})
