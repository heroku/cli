'use strict'
/* globals describe it beforeEach afterEach context cli nock expect */

let cmd = require('../../../commands/access/add')
let error = require('../../../lib/error')
let assertExit = require('../../assert_exit')
let unwrap = require('../../unwrap')
let stubGet = require('../../stub/get')
let stubPost = require('../../stub/post')
let api
let apiPermissionsVariant
let apiV2

describe('heroku access:add', () => {
  context('with an org app with user permissions', () => {
    beforeEach(() => {
      cli.mockConsole()
      api = stubGet.orgApp()
      apiPermissionsVariant = stubPost.collaboratorsWithPermissions(['deploy', 'view'])
      apiV2 = stubGet.orgFlags(['org-access-controls'])
    })
    afterEach(() => nock.cleanAll())

    it('adds user to the app with permissions, and view is implicit', () => {
      return cmd.run({app: 'myapp', args: {email: 'raulb@heroku.com'}, flags: { permissions: 'deploy' }})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Adding raulb@heroku.com access to the app myapp with deploy,view permissions... done
`).to.eq(cli.stderr))
        .then(() => api.done())
        .then(() => apiV2.done())
        .then(() => apiPermissionsVariant.done())
    })

    it('adds user to the app with permissions, even specifying the view permission', () => {
      return cmd.run({app: 'myapp', args: {email: 'raulb@heroku.com'}, flags: { permissions: 'deploy,view' }})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Adding raulb@heroku.com access to the app myapp with deploy,view permissions... done
`).to.eq(cli.stderr))
        .then(() => api.done())
        .then(() => apiV2.done())
        .then(() => apiPermissionsVariant.done())
    })

    it('raises an error when permissions are not specified', () => {
      error.exit.mock()

      return assertExit(1, cmd.run({
        app: 'myapp', args: {email: 'raulb@heroku.com'}, flags: {}
      }).then(() => {
        api.done()
        apiV2.done()
        apiPermissionsVariant.done()
      })).then(function () {
        expect(unwrap(cli.stderr)).to.equal(` ▸    Missing argument: permissions
`)
      })
    })

    it('supports --privileges, but shows deprecation warning', () => {
      return cmd.run({app: 'myapp', args: {email: 'raulb@heroku.com'}, flags: { privileges: 'deploy,view' }})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(' ▸    DEPRECATION WARNING: use `--permissions` not `--privileges`\nAdding raulb@heroku.com access to the app myapp with deploy,view permissions... done\n').to.eq(cli.stderr))
    })
  })

  context('with an org app without user permissions', () => {
    beforeEach(() => {
      cli.mockConsole()
      api = stubGet.orgApp()
      apiPermissionsVariant = stubPost.collaborators()
      apiV2 = stubGet.orgFlags([])
    })
    afterEach(() => nock.cleanAll())

    it('adds user to the app', () => {
      return cmd.run({app: 'myapp', args: {email: 'raulb@heroku.com'}, flags: {}})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Adding raulb@heroku.com access to the app myapp... done
`).to.eq(cli.stderr))
        .then(() => api.done())
        .then(() => apiV2.done())
        .then(() => apiPermissionsVariant.done())
    })
  })

  context('with a non org app', () => {
    beforeEach(() => {
      cli.mockConsole()
      api = stubGet.personalApp()
      apiPermissionsVariant = stubPost.collaborators()
    })
    afterEach(() => nock.cleanAll())

    it('adds user to the app as a collaborator', () => {
      return cmd.run({app: 'myapp', args: {email: 'raulb@heroku.com'}, flags: {}})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Adding raulb@heroku.com access to the app myapp... done
`).to.eq(cli.stderr))
        .then(() => api.done())
        .then(() => apiPermissionsVariant.done())
    })
  })
})
