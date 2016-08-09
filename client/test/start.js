'use strict'

/* globals describe it beforeEach */

const cli = require('heroku-cli-util')
const start = require('../lib/start')

describe('start', () => {
  beforeEach(() => cli.mockConsole())

  it('shows the help', () => {
    return start(['heroku', 'help'])
    .then(() => cli.stdout.should.match(/^Usage: heroku/))
  })
})
