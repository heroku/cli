'use strict'

/* globals describe it beforeEach */

const cli = require('heroku-cli-util')
const plugins = require('../../../lib/plugins')
const {commands} = require('../../..')
const cmd = commands.find(c => c.topic === 'plugins' && !c.command)

describe(`${cmd.topic}${cmd.command ? ':' + cmd.command : ''}`, () => {
  beforeEach(function () {
    cli.mockConsole()
    if (!plugins.get().find(p => p.name === 'heroku-debug')) {
      this.timeout(120000)
      return plugins.install('heroku-debug')
    }
  })

  it('shows heroku-debug', () => {
    return cmd.run()
    .then(() => cli.stdout.should.match(/heroku-debug/))
  })
})
