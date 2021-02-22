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
  context('with a team app with user permissions', () => {
    beforeEach(() => {
      cli.mockConsole()
      apiGet = stubGet.teamApp()
      apiPost = stubPost.teamAppCollaborators('raulb@heroku.com', ['deploy', 'view'])
      apiGetOrgFeatures = stubGet.teamFeatures([{ name: 'org-access-controls' }])
    })
    afterEach(() => nock.cleanAll())

    it('adds user to the app with permissions, and view is implicit', async () => {
      await cmd.run({ app: 'myapp', args: { email: 'raulb@heroku.com' }, flags: { permissions: 'deploy' } })

      expect('').to.eq(cli.stdout);

      expect(`Adding raulb@heroku.com access to the app myapp with deploy,view permissions... done
`).to.eq(cli.stderr);

      apiGet.done();
      apiGetOrgFeatures.done();

      return apiPost.done()
    })

    it('adds user to the app with permissions, even specifying the view permission', async () => {
      await cmd.run({ app: 'myapp', args: { email: 'raulb@heroku.com' }, flags: { permissions: 'deploy,view' } })

      expect('').to.eq(cli.stdout);

      expect(`Adding raulb@heroku.com access to the app myapp with deploy,view permissions... done
`).to.eq(cli.stderr);

      apiGet.done();
      apiGetOrgFeatures.done();

      return apiPost.done()
    })

    it('raises an error when permissions are not specified', async () => {
      error.exit.mock()

      await assertExit(1, cmd.run({
        app: 'myapp', args: { email: 'raulb@heroku.com' }, flags: {}
      }))

      apiPost.done()
      apiGetOrgFeatures.done()
      apiGet.done()

      expect(unwrap(cli.stderr)).to.equal('Missing argument: permissions\n')
    })

    it('supports --privileges, but shows deprecation warning', async () => {
      await cmd.run({ app: 'myapp', args: { email: 'raulb@heroku.com' }, flags: { privileges: 'deploy,view' } })

      expect('').to.eq(cli.stdout);

      return expect(unwrap(cli.stderr)).to.equal(`DEPRECATION WARNING: use \`--permissions\` not \`--privileges\`
Adding raulb@heroku.com access to the app myapp with deploy,view permissions... done
`)
    })
  })

  context('with a team app without user permissions', () => {
    beforeEach(() => {
      cli.mockConsole()
      apiGet = stubGet.teamApp()
      apiPost = stubPost.collaborators()
      apiGetOrgFeatures = stubGet.teamFeatures([])
    })
    afterEach(() => nock.cleanAll())

    it('adds user to the app', async () => {
      await cmd.run({ app: 'myapp', args: { email: 'raulb@heroku.com' }, flags: {} })

      expect('').to.eq(cli.stdout);

      expect(`Adding raulb@heroku.com access to the app myapp... done
`).to.eq(cli.stderr);

      apiGet.done();
      apiGetOrgFeatures.done();

      return apiPost.done()
    })
  })

  context('with a non team app', () => {
    beforeEach(() => {
      cli.mockConsole()
      apiGet = stubGet.personalApp()
      apiPost = stubPost.collaborators()
    })
    afterEach(() => nock.cleanAll())

    it('adds user to the app as a collaborator', async () => {
      await cmd.run({ app: 'myapp', args: { email: 'raulb@heroku.com' }, flags: {} })

      expect('').to.eq(cli.stdout);

      expect(`Adding raulb@heroku.com access to the app myapp... done
`).to.eq(cli.stderr);

      apiGet.done();

      return apiPost.done()
    })
  })
})
