'use strict'
/* global afterEach beforeEach commands cli nock */

let cmd = commands.find(c => c.topic === 'addons' && c.command === 'attach')
const {expect} = require('chai')

let confirmApp

describe('addons:attach', function () {
  beforeEach(() => {
    confirmApp = cli.confirmApp
    cli.confirmApp = () => Promise.resolve()
    cli.mockConsole()
  })
  afterEach(() => {
    cli.confirmApp = confirmApp
    nock.cleanAll()
  })

  //   it('attaches an add-on', function () {
  //     let api = nock('https://api.heroku.com:443')
  //       .get('/addons/redis-123')
  //       .reply(200, {name: 'redis-123'})
  //       .post('/addon-attachments', {app: {name: 'myapp'}, addon: {name: 'redis-123'}})
  //       .reply(201, {name: 'REDIS'})
  //       .get('/apps/myapp/releases')
  //       .reply(200, [{version: 10}])
  //     return cmd.run({app: 'myapp', args: {addon_name: 'redis-123'}, flags: {}})
  //       .then(() => expect(cli.stdout, 'to be empty'))
  //       .then(() => expect(cli.stderr).to.equal(`Attaching redis-123 to myapp... done
  // Setting REDIS config vars and restarting myapp... done, v10
  // `))
  //       .then(() => api.done())
  //   })

  it('attaches an add-on as foo', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/addons/redis-123')
      .reply(200, {name: 'redis-123'})
      .post('/addon-attachments', {name: 'foo', app: {name: 'myapp'}, addon: {name: 'redis-123'}})
      .reply(201, {name: 'foo'})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])
    return cmd.run({app: 'myapp', args: {addon_name: 'redis-123'}, flags: {as: 'foo'}})
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr).to.equal(`Attaching redis-123 as foo to myapp... done
  Setting foo config vars and restarting myapp... done, v10
  `))
      .then(() => api.done())
  })

  //   it('overwrites an add-on as foo when confirmation is set', function () {
  //     let api = nock('https://api.heroku.com:443')
  //       .get('/addons/redis-123')
  //       .reply(200, {name: 'redis-123'})
  //       .post('/addon-attachments', {name: 'foo', app: {name: 'myapp'}, addon: {name: 'redis-123'}})
  //       .reply(400, {id: 'confirmation_required'})
  //       .post('/addon-attachments', {name: 'foo', app: {name: 'myapp'}, addon: {name: 'redis-123'}, confirm: 'myapp'})
  //       .reply(201, {name: 'foo'})
  //       .get('/apps/myapp/releases')
  //       .reply(200, [{version: 10}])
  //     return cmd.run({app: 'myapp', args: {addon_name: 'redis-123'}, flags: {as: 'foo'}})
  //       .then(() => expect(cli.stdout, 'to be empty'))
  //       .then(() => expect(cli.stderr).to.equal(`Attaching redis-123 as foo to myapp... !
  // Attaching redis-123 as foo to myapp... done
  // Setting foo config vars and restarting myapp... done, v10
  // `))
  //       .then(() => api.done())
  //   })

//   it('attaches an addon without a namespace if the credential flag is set to default', function () {
//     let api = nock('https://api.heroku.com:443')
//       .get('/addons/postgres-123')
//       .reply(200, {name: 'postgres-123'})
//       .post('/addon-attachments', {app: {name: 'myapp'}, addon: {name: 'postgres-123'}})
//       .reply(201, {name: 'POSTGRES_HELLO'})
//       .get('/apps/myapp/releases')
//       .reply(200, [{version: 10}])
//     return cmd.run({app: 'myapp', args: {addon_name: 'postgres-123'}, flags: {credential: 'default'}})
//       .then(() => expect(cli.stdout, 'to be empty'))
//       .then(() => expect(cli.stderr).to.equal(`Attaching default of postgres-123 to myapp... done
// Setting POSTGRES_HELLO config vars and restarting myapp... done, v10
// `))
//       .then(() => api.done())
//   })
//
//   it('attaches in the credential namespace if the credential flag is specified', function () {
//     let api = nock('https://api.heroku.com:443')
//       .get('/addons/postgres-123')
//       .reply(200, {name: 'postgres-123'})
//       .get('/addons/postgres-123/config/credential:hello')
//       .reply(200, [{some: 'config'}])
//       .post('/addon-attachments', {app: {name: 'myapp'}, addon: {name: 'postgres-123'}, namespace: 'credential:hello'})
//       .reply(201, {name: 'POSTGRES_HELLO'})
//       .get('/apps/myapp/releases')
//       .reply(200, [{version: 10}])
//     return cmd.run({app: 'myapp', args: {addon_name: 'postgres-123'}, flags: {credential: 'hello'}})
//       .then(() => expect(cli.stdout, 'to be empty'))
//       .then(() => expect(cli.stderr).to.equal(`Attaching hello of postgres-123 to myapp... done
// Setting POSTGRES_HELLO config vars and restarting myapp... done, v10
// `))
//       .then(() => api.done())
//   })
//
//   it('errors if the credential flag is specified but that credential does not exist for that addon', function () {
//     nock('https://api.heroku.com:443')
//       .get('/addons/postgres-123')
//       .reply(200, {name: 'postgres-123'})
//       .get('/addons/postgres-123/config/credential:hello')
//       .reply(200, [])
//
//     return cmd.run({
//       app: 'myapp',
//       args: {addon_name: 'postgres-123'},
//       flags: {credential: 'hello'},
//     })
//       .then(() => {
//         throw new Error('unreachable')
//       })
//       .catch(error => expect(error.message).to.equal('Could not find credential hello for database postgres-123'))
//   })
})
