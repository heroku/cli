'use strict'

/* globals describe it beforeEach */

const cli = require('heroku-cli-util')
const {commands} = require('../..')
const cmd = commands.find(c => c.topic === 'version' && !c.command)

describe(`${cmd.topic}${cmd.command ? ':' + cmd.command : ''}`, () => {
  beforeEach(() => cli.mockConsole())

  it('shows the version', () => {
    return Promise.resolve(cmd.run())
    .then(() => cli.stdout.should.match(/^heroku-cli/))
  })
})
