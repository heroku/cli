'use strict'
/* globals describe it beforeEach afterEach context cli nock expect */

let cmd = require('../../../commands/access/update')
let error = require('../../../lib/error')
let assertExit = require('../../assert_exit')
let unwrap = require('../../unwrap')
let stubPatch = require('../../stub/patch')
let stubGet = require('../../stub/get')
let apiPatchAppCollaborators
let apiGetApp

describe('heroku access:update', () => {
  context('with a team app with permissions', () => {
    beforeEach(() => cli.mockConsole())
    afterEach(() => nock.cleanAll())

    it('updates the app permissions, view being implicit', async () => {
      apiGetApp = stubGet.teamApp()
      apiPatchAppCollaborators = stubPatch.appCollaboratorWithPermissions({ email: 'raulb@heroku.com', permissions: ['deploy', 'view'] })

      await cmd.run({ app: 'myapp', args: { email: 'raulb@heroku.com' }, flags: { permissions: 'deploy' } })

      expect('').to.eq(cli.stdout);

      expect(`Updating raulb@heroku.com in application myapp with deploy,view permissions... done
`).to.eq(cli.stderr);

      apiGetApp.done();

      return apiPatchAppCollaborators.done()
    })

    it('updates the app permissions, even specifying view as a permission', async () => {
      apiGetApp = stubGet.teamApp()
      apiPatchAppCollaborators = stubPatch.appCollaboratorWithPermissions({ email: 'raulb@heroku.com', permissions: ['deploy', 'view'] })

      await cmd.run({ app: 'myapp', args: { email: 'raulb@heroku.com' }, flags: { permissions: 'deploy,view' } })

      expect('').to.eq(cli.stdout);

      expect(`Updating raulb@heroku.com in application myapp with deploy,view permissions... done
`).to.eq(cli.stderr);

      apiGetApp.done();

      return apiPatchAppCollaborators.done()
    })

    it('supports --privileges, but shows deprecation warning', async () => {
      apiGetApp = stubGet.teamApp()
      apiPatchAppCollaborators = stubPatch.appCollaboratorWithPermissions({ email: 'raulb@heroku.com', permissions: ['deploy', 'view'] })

      await cmd.run({ app: 'myapp', args: { email: 'raulb@heroku.com' }, flags: { privileges: 'deploy' } })

      expect('').to.eq(cli.stdout);

      expect(unwrap(cli.stderr)).to.equal(`DEPRECATION WARNING: use \`--permissions\` not \`--privileges\`
Updating raulb@heroku.com in application myapp with deploy,view permissions... done
`);

      apiGetApp.done();

      return apiPatchAppCollaborators.done()
    })
  })

  context('with a non team app', () => {
    beforeEach(() => {
      cli.mockConsole()
      error.exit.mock()
    })
    afterEach(() => nock.cleanAll())

    it('returns an error when passing permissions', async () => {
      apiGetApp = stubGet.personalApp()

      await assertExit(1, cmd.run({
        app: 'myapp',
        args: { email: 'raulb@heroku.com' },
        flags: { permissions: 'view,deploy' }
      }))

      apiGetApp.done();

      expect(unwrap(cli.stderr)).to.equal('Error: cannot update permissions. The app myapp is not owned by a team\n')
    })
  })
})
