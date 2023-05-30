'use strict'
/* globals beforeEach cli */

let chai = require('chai')
let chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

let expect = chai.expect
let nock = require('nock')
let certs = require('../../../../../commands/certs/auto/disable.js')

describe('heroku certs:auto:disable', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('disables acm', function () {
    let api = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    })

    api.delete('/apps/example/acm').reply(200, {acm: true})

    return certs.run({app: 'example', flags: {confirm: 'example'}}).then(function () {
      expect(cli.stderr).to.equal('Disabling Automatic Certificate Management... done\n')
      expect(cli.stdout).to.equal('')
      api.done()
    })
  })

  it('confirms that they want to disable', function () {
    return expect(certs.run({app: 'example', flags: {confirm: 'notexample'}}))
      .to.be.rejectedWith('Confirmation notexample did not match example. Aborted.')
  })
})
