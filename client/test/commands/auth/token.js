'use strict'

/* globals describe it beforeEach */

const cli = require('heroku-cli-util')
const {commands} = require('../../..')
const cmd = commands.find(c => c.topic === 'auth' && c.command === 'token')

describe(`${cmd.topic}${cmd.command ? ':' + cmd.command : ''}`, () => {
  beforeEach(() => cli.mockConsole())

  it('shows the logged in user', () => {
    return cmd.run.bind({auth: {password: 'abc123'}})()
    .then(() => cli.stdout.should.eq('abc123\n'))
  })
})
