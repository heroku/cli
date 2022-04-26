'use strict'
/* global describe it */

const { expect } = require('chai')

describe('all commands', () => {
  it('should needsApp', () => {
    const missingNeedsApp = require('..').commands.filter((command) => !command.needsApp)
    expect(missingNeedsApp).to.deep.equal([])
  })
})
