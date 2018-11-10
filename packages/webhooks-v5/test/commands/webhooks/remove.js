'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let certs = require('../../../commands/webhooks/remove')

describe('heroku webhooks:add', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('# removes webhooks', function () {
    let mock = nock('https://api.heroku.com')
      .delete('/apps/example/webhooks/99999999-9999-9999-9999-999999999999')
      .reply(200, {})

    return certs.run(['99999999-9999-9999-9999-999999999999', '--app', 'example']).then(function () {
      mock.done()
      expect(cli.stdout).to.equal('')
      expect(cli.stderr).to.equal('Removing webhook 99999999-9999-9999-9999-999999999999 from example... done\n')
    })
  })

  it('# removes webhooks (pipelines)', function () {
    let mock = nock('https://api.heroku.com')
      .delete('/pipelines/example/webhooks/99999999-9999-9999-9999-999999999999')
      .reply(200, {})

    return certs.run(['99999999-9999-9999-9999-999999999999', '--pipeline', 'example']).then(function () {
      mock.done()
      expect(cli.stdout).to.equal('')
      expect(cli.stderr).to.equal('Removing webhook 99999999-9999-9999-9999-999999999999 from example... done\n')
    })
  })
})
