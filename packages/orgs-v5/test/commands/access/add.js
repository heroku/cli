'use strict'
/* globals describe it beforeEach afterEach context cli nock expect */

let cmd = require('../../../commands/access/add')[0]
let error = require('../../../lib/error')
let assertExit = require('../../assert_exit')
let unwrap = require('../../unwrap')
let stubGet = require('../../stub/get')
let stubPost = require('../../stub/post')
let apiGet
let apiPost
let apiGetOrgFeatures

describe('heroku access:add', () => {
  context('with an org app with user permissions', () => {
    beforeEach(() => {
      cli.mockConsole()
      apiGet = stubGet.orgApp()
      apiPost = stubPost.orgAppcollaborators('raulb@heroku.com', ['deploy', 'view'])
      apiGetOrgFeatures = stubGet.orgFeatures([{ name: 'org-access-controls' }])
    })
    afterEach(() => nock.cleanAll())

    it('adds user to the app with permissions, and view is implicit', () => {
      return cmd.run({ app: 'myapp', args: { email: 'raulb@heroku.com' }, flags: { permissions: 'deploy' } })
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Adding raulb@heroku.com access to the app myapp with deploy,view permissions... done
`).to.eq(cli.stderr))
        .then(() => apiGet.done())
        .then(() => apiGetOrgFeatures.done())
        .then(() => apiPost.done())
    })

    it('adds user to the app with permissions, even specifying the view permission', () => {
      return cmd.run({ app: 'myapp', args: { email: 'raulb@heroku.com' }, flags: { permissions: 'deploy,view' } })
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Adding raulb@heroku.com access to the app myapp with deploy,view permissions... done
`).to.eq(cli.stderr))
        .then(() => apiGet.done())
        .then(() => apiGetOrgFeatures.done())
        .then(() => apiPost.done())
    })

    it('raises an error when permissions are not specified', () => {
      error.exit.mock()

      return assertExit(1, cmd.run({
        app: 'myapp', args: { email: 'raulb@heroku.com' }, flags: {}
      }).then(() => {
        apiGet.done()
        apiGetOrgFeatures.done()
        apiPost.done()
      })).then(function () {
        expect(unwrap(cli.stderr)).to.equal(` ▸    Missing argument: permissions
`)
      })
    })

    it('supports --privileges, but shows deprecation warning', () => {
      return cmd.run({ app: 'myapp', args: { email: 'raulb@heroku.com' }, flags: { privileges: 'deploy,view' } })
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(' ▸    DEPRECATION WARNING: use `--permissions` not `--privileges`\nAdding raulb@heroku.com access to the app myapp with deploy,view permissions... done\n').to.eq(cli.stderr))
    })
  })

  context('with an org app without user permissions', () => {
    beforeEach(() => {
      cli.mockConsole()
      apiGet = stubGet.orgApp()
      apiPost = stubPost.collaborators()
      apiGetOrgFeatures = stubGet.orgFeatures([])
    })
    afterEach(() => nock.cleanAll())

    it('adds user to the app', () => {
      return cmd.run({ app: 'myapp', args: { email: 'raulb@heroku.com' }, flags: {} })
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Adding raulb@heroku.com access to the app myapp... done
`).to.eq(cli.stderr))
        .then(() => apiGet.done())
        .then(() => apiGetOrgFeatures.done())
        .then(() => apiPost.done())
    })
  })

  context('with a non org app', () => {
    beforeEach(() => {
      cli.mockConsole()
      apiGet = stubGet.personalApp()
      apiPost = stubPost.collaborators()
    })
    afterEach(() => nock.cleanAll())

    it('adds user to the app as a collaborator', () => {
      return cmd.run({ app: 'myapp', args: { email: 'raulb@heroku.com' }, flags: {} })
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Adding raulb@heroku.com access to the app myapp... done
`).to.eq(cli.stderr))
        .then(() => apiGet.done())
        .then(() => apiPost.done())
    })
  })
})
