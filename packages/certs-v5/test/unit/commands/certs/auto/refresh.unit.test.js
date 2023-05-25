'use strict'
/* globals beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let certs = require('../../../../../commands/certs/auto/refresh.js')

describe('heroku certs:auto:enable', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('refreshes acm', function () {
    let api = nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3.cedar-acm'},
    })

    api.patch('/apps/example/acm', {acm_refresh: true}).reply(200, {acm: true, acm_refresh: true})

    return certs.run({app: 'example'}).then(function () {
      expect(cli.stderr).to.equal('Refreshing Automatic Certificate Management... done\n')
      expect(cli.stdout).to.equal('')
      api.done()
    })
  })
})
