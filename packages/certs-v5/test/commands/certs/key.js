'use strict'
/* globals beforeEach cli */

let expect = require('chai').expect
// let nock = require('nock')
// var fs = require('fs')
// var sinon = require('sinon')

let certs = require('../../../commands/certs/key.js')
// let assertExit = require('../../assert_exit.js')
// let error = require('../../../lib/error.js')
// const unwrap = require('../../unwrap')

// TODO: Update tests once fix has been implemented

describe('heroku certs:key', function () {
  beforeEach(function () {
    cli.mockConsole()
    // error.exit.mock()

    // sinon.stub(fs, 'readFile')
    // fs.readFile.throws('unstubbed')

    // nock.cleanAll()
  })

  // afterEach(function () {
  //   fs.readFile.restore()
  // })

  it('# checks command does nothing', function () {
    return certs.run({app: 'example', args: []}).then(function () {
      expect(cli.stdout).to.equal('')
      expect(cli.stderr).to.equal('')
    })
  })
})
