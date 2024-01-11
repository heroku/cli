'use strict'
/* globals beforeEach afterEach commands */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = commands.find(c => c.topic === 'stack' && !c.command)
const {expect} = require('chai')

describe('stack', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('show available stacks', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp').reply(200, {
        name: 'myapp',
        build_stack: {name: 'cedar-14'},
        stack: {name: 'cedar-14'},
      })
      .get('/stacks')
      .reply(200, [
        {name: 'cedar'},
        {name: 'cedar-14'},
      ])
    return cmd.run({app: 'myapp', flags: {}})
      .then(() => expect(cli.stdout).to.equal(`=== myapp Available Stacks
  cedar-10
* cedar-14
`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('show an undeployed build stack', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp').reply(200, {
        name: 'myapp',
        build_stack: {name: 'cedar'},
        stack: {name: 'cedar-14'},
      })
      .get('/stacks')
      .reply(200, [
        {name: 'cedar'},
        {name: 'cedar-14'},
      ])
    return cmd.run({app: 'myapp', flags: {}})
      .then(() => expect(cli.stdout).to.equal(`=== myapp Available Stacks
  cedar-10 (active on next deploy)
* cedar-14
`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })
})
