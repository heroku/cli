'use strict'
/* globals beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')
let exit = require('heroku-cli-util').exit
const unwrap = require('../../unwrap')

exports.shouldHandleArgs = function (command, flags) {
  flags = flags || {}

  describe('', function () {
    beforeEach(function () {
      cli.mockConsole()
      exit.mock()
      nock.cleanAll()
    })

    it('# shows an error if an app has no addons', function () {
      let app = nock('https://api.heroku.com:443')
        .get('/apps/example/addons').reply(200, [])
      return expect(command.run({app: 'example', flags: flags, args: {}})).to.be.rejectedWith(exit.ErrorExit)
        .then(() => app.done())
        .then(() => expect(cli.stdout).to.equal(''))
        .then(() => expect(unwrap(cli.stderr)).to.equal('No Redis instances found.\n'))
    })

    it('# shows an error if the addon is ambiguous', function () {
      let app = nock('https://api.heroku.com:443')
        .get('/apps/example/addons').reply(200, [
          {name: 'redis-haiku-a', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO']},
          {name: 'redis-haiku-b', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_BAR']},
        ])
      return expect(command.run({app: 'example', flags: flags, args: {}})).to.be.rejectedWith(exit.ErrorExit)
        .then(() => app.done())
        .then(() => expect(cli.stdout).to.equal(''))
        .then(() => expect(unwrap(cli.stderr)).to.equal('Please specify a single instance. Found: redis-haiku-a, redis-haiku-b\n'))
    })
  })
}
