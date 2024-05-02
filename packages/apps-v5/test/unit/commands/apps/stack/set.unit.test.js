'use strict'
/* globals beforeEach commands */

const expect = require('chai').expect
const cli = require('@heroku/heroku-cli-util')
const nock = require('nock')
const cmd = commands.find(c => c.topic === 'stack' && c.command === 'set')

const pendingUpgradeApp = {
  name: 'myapp',
  stack: {
    name: 'heroku-16',
  },
  build_stack: {
    name: 'heroku-22',
  },
}

const completedUpgradeApp = {
  name: 'myapp',
  stack: {
    name: 'heroku-22',
  },
  build_stack: {
    name: 'heroku-22',
  },
}

describe('stack:set', function () {
  beforeEach(() => cli.mockConsole())

  it('sets the stack', function () {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp', {build_stack: 'heroku-22'})
      .reply(200, pendingUpgradeApp)

    return cmd.run({app: 'myapp', args: {stack: 'heroku-22'}, flags: {}})
      .then(() => expect(cli.stderr).to.equal('Setting stack to heroku-22... done\n'))
      .then(() => expect(cli.stdout).to.equal(`You will need to redeploy myapp for the change to take effect.
Run git push heroku main to trigger a new build on myapp.
`))
      .then(() => api.done())
  })

  it('sets the stack on a different remote', function () {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp', {build_stack: 'heroku-22'})
      .reply(200, pendingUpgradeApp)

    return cmd.run({app: 'myapp', args: {stack: 'heroku-22'}, flags: {remote: 'staging'}})
      .then(() => expect(cli.stderr).to.equal('Setting stack to heroku-22... done\n'))
      .then(() => expect(cli.stdout).to.equal(`You will need to redeploy myapp for the change to take effect.
Run git push staging main to trigger a new build on myapp.
`))
      .then(() => api.done())
  })

  it('does not show the redeploy message if the stack was immediately updated by API', function () {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp', {build_stack: 'heroku-22'})
      .reply(200, completedUpgradeApp)

    return cmd.run({app: 'myapp', args: {stack: 'heroku-22'}, flags: {}})
      .then(() => expect(cli.stderr).to.equal('Setting stack to heroku-22... done\n'))
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => api.done())
  })
})
