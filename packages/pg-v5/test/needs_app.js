'use strict'
/* global describe it */

const expect = require('unexpected')

describe('all commands', () => {
  it('should needsApp', () => {
    const missingNeedsApp = require('..').commands.filter((command) => !command.needsApp)
    expect(missingNeedsApp, 'to equal', [])
  })
})
