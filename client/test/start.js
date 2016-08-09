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

  it('shows the help for apps', () => {
    return start(['heroku', 'help', 'apps'])
    .then(() => cli.stdout.should.match(/^Usage: heroku/))
  })
})
