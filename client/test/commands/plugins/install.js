'use strict'

/* globals describe it beforeEach */

const cli = require('heroku-cli-util')
const plugins = require('../../../lib/plugins')
const {commands} = require('../../..')
const cmd = commands.find(c => c.topic === 'plugins' && c.command === 'install')

describe(`${cmd.topic}${cmd.command ? ':' + cmd.command : ''}`, () => {
  beforeEach(function () {
    cli.mockConsole()
  })

  it('shows heroku-debug', () => {
    return cmd.run.bind({args: {plugin: 'heroku-debug'}})()
    .then(() => plugins.get().find(p => p.name === 'heroku-debug').name.should.eq('heroku-debug'))
  })
})
