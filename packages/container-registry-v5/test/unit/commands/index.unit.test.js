'use strict'
/* globals beforeEach afterEach */

const cli = require('@heroku/heroku-cli-util')
var pkg = require('../../../package.json')
const cmdIndex = require('../../../commands/index')(pkg)
const {expect} = require('chai')
const sinon = require('sinon')

describe('container run', () => {
  let showVersionStub

  beforeEach(() => {
    cli.mockConsole()
    showVersionStub = sinon.stub(console, 'log')
  })

  afterEach(() => showVersionStub.restore())

  it('shows package version', () => {
    cmdIndex.run()
    expect(showVersionStub.called).to.equal(true)
  })
})
