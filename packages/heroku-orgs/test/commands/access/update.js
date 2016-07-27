'use strict'
/* globals describe it beforeEach afterEach context cli nock expect */

let cmd = require('../../../commands/access/update')
let error = require('../../../lib/error')
let assertExit = require('../../assert_exit')
let unwrap = require('../../unwrap')

describe('heroku access:update', () => {
  context('with an org app with permissions', () => {
    beforeEach(() => cli.mockConsole())
    afterEach(() => nock.cleanAll())

    it('updates the app permissions, view being implicit', () => {
      let api = nock('https://api.heroku.com:443')
        .get('/apps/myapp')
        .reply(200, {
          name: 'myapp',
          owner: { email: 'myorg@herokumanager.com' }
        })
      let apiPermissionsVariant = nock('https://api.heroku.com:443', {
        reqheaders: {Accept: 'application/vnd.heroku+json; version=3'}
      })
        .patch('/organizations/apps/myapp/collaborators/raulb@heroku.com', {
          permissions: ['deploy', 'view']
        }).reply(200)

      return cmd.run({app: 'myapp', args: {email: 'raulb@heroku.com'}, flags: { permissions: 'deploy' }})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Updating raulb@heroku.com in application myapp with deploy,view permissions... done
`).to.eq(cli.stderr))
        .then(() => api.done())
        .then(() => apiPermissionsVariant.done())
    })

    it('updates the app permissions, even specifying view as a permission', () => {
      let api = nock('https://api.heroku.com:443')
        .get('/apps/myapp')
        .reply(200, {
          name: 'myapp',
          owner: { email: 'myorg@herokumanager.com' }
        })
      let apiPermissionsVariant = nock('https://api.heroku.com:443', {
        reqheaders: {Accept: 'application/vnd.heroku+json; version=3'}
      })
        .patch('/organizations/apps/myapp/collaborators/raulb@heroku.com', {
          permissions: ['deploy', 'view']
        }).reply(200)

      return cmd.run({app: 'myapp', args: {email: 'raulb@heroku.com'}, flags: { permissions: 'deploy,view' }})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Updating raulb@heroku.com in application myapp with deploy,view permissions... done
`).to.eq(cli.stderr))
        .then(() => api.done())
        .then(() => apiPermissionsVariant.done())
    })

    it('supports --privileges, but shows deprecation warning', () => {
      let api = nock('https://api.heroku.com:443')
        .get('/apps/myapp')
        .reply(200, {
          name: 'myapp',
          owner: { email: 'myorg@herokumanager.com' }
        })
      let apiPermissionsVariant = nock('https://api.heroku.com:443', {
        reqheaders: {Accept: 'application/vnd.heroku+json; version=3'}
      })
        .patch('/organizations/apps/myapp/collaborators/raulb@heroku.com', {
          permissions: ['deploy', 'view']
        }).reply(200)

      return cmd.run({app: 'myapp', args: {email: 'raulb@heroku.com'}, flags: { privileges: 'deploy' }})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(' ▸    DEPRECATION WARNING: use `--permissions` not `--privileges`\nUpdating raulb@heroku.com in application myapp with deploy,view permissions... done\n').to.eq(cli.stderr))
        .then(() => api.done())
        .then(() => apiPermissionsVariant.done())
    })
  })

  context('with a non org app', () => {
    beforeEach(() => {
      cli.mockConsole()
      error.exit.mock()
    })
    afterEach(() => nock.cleanAll())

    it('returns an error when passing permissions', () => {
      let api = nock('https://api.heroku.com:443')
        .get('/apps/myapp')
        .reply(200, {
          name: 'myapp',
          owner: { email: 'raulb@heroku.com' }
        })

      return assertExit(1, cmd.run({
        app: 'myapp',
        args: {email: 'raulb@heroku.com'},
        flags: { permissions: 'view,deploy' }
      }).then(() => api.done())).then(function () {
        expect(unwrap(cli.stderr)).to.equal(` ▸    Error: cannot update permissions. The app myapp is not owned by an organization
`)
      })
    })
  })
})
