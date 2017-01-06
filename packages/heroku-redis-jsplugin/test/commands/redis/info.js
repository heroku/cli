'use strict'
/* globals describe it beforeEach cli */

let expect = require('chai').expect
let nock = require('nock')

let commands = [
  {txt: ':info', command: require('../../../lib/commands/redis/info.js')},
  {txt: '', command: require('../../../lib/commands/redis/index.js')}
]

commands.forEach((cmd) => {
  let {txt, command} = cmd
  describe(`heroku redis${txt}`, function () {
    beforeEach(function () {
      cli.mockConsole()
      nock.cleanAll()
    })

    it('# prints out nothing when there is no redis DB', function () {
      let app = nock('https://api.heroku.com:443')
        .get('/apps/example/addons').reply(200, [])

      return command.run({app: 'example', args: {}})
      .then(() => app.done())
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal(''))
    })

    it('# prints out redis info', function () {
      let app = nock('https://api.heroku.com:443')
        .get('/apps/example/addons').reply(200, [
          {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']}
        ])

      let redis = nock('https://redis-api.heroku.com:443')
        .get('/redis/v0/databases/redis-haiku').reply(200, {info: [
          {name: 'Foo', values: ['Bar', 'Biz']}
        ]})

      return command.run({app: 'example', args: {}, auth: {username: 'foobar', password: 'password'}})
      .then(() => app.done())
      .then(() => redis.done())
      .then(() => expect(cli.stdout).to.equal(
`=== redis-haiku (REDIS_FOO, REDIS_BAR)
Foo: Bar
     Biz
`))
      .then(() => expect(cli.stderr).to.equal(''))
    })

    it('# prints out redis info when not found', function () {
      let app = nock('https://api.heroku.com:443')
        .get('/apps/example/addons').reply(200, [
          {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']}
        ])

      let redis = nock('https://redis-api.heroku.com:443')
        .get('/redis/v0/databases/redis-haiku').reply(404, {})

      return command.run({app: 'example', args: {}, auth: {username: 'foobar', password: 'password'}})
      .then(() => app.done())
      .then(() => redis.done())
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal(''))
    })

    it('# prints out redis info when error', function () {
      nock('https://api.heroku.com:443')
        .get('/apps/example/addons').reply(200, [
          {name: 'redis-haiku', addon_service: {name: 'heroku-redis'}, config_vars: ['REDIS_FOO', 'REDIS_BAR']}
        ])

      nock('https://redis-api.heroku.com:443')
        .get('/redis/v0/databases/redis-haiku').reply(503, {})

      return expect(command.run({app: 'example', args: {}, auth: {username: 'foobar', password: 'password'}})).to.be.rejectedWith(/Expected response to be successful, got 503/)
    })
  })
})
