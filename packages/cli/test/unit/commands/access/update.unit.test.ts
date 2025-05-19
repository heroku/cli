import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/access/update.js'
import runCommand from '../../../helpers/runCommand.js'
import nock from 'nock'
import {expect} from 'chai'
import {personalApp, teamApp} from '../../../helpers/stubs/get.js'
import {appCollaboratorWithPermissions} from '../../../helpers/stubs/patch.js'
import stripAnsi from 'strip-ansi'

/*
describe('heroku access:update', function () {
  context('with a team app with permissions', function () {
    afterEach(function () {
      return nock.cleanAll()
    })

    it('updates the app permissions, view being implicit', async function () {
      teamApp()
      appCollaboratorWithPermissions({email: 'gandalf@heroku.com', permissions: ['deploy', 'view']})
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--permissions',
        'deploy',
        'gandalf@heroku.com',
      ])
      expect('').to.eq(stdout.output)
      expect(stderr.output).to.equal('Updating gandalf@heroku.com in application myapp with deploy,view permissions... done\n')
    })

    it('updates the app permissions, even specifying view as a permission', async function () {
      teamApp()
      appCollaboratorWithPermissions({email: 'gandalf@heroku.com', permissions: ['deploy', 'view']})
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--permissions',
        'deploy,view',
        'gandalf@heroku.com',
      ])
      expect('').to.eq(stdout.output)
      expect(stderr.output).to.equal('Updating gandalf@heroku.com in application myapp with deploy,view permissions... done\n')
    })
  })

  context('with a non team app', function () {
    afterEach(function () {
      return nock.cleanAll()
    })
    it('returns an error when passing permissions', async function () {
      personalApp()
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--permissions',
        'view,deploy',
        'gandalf@heroku.com',
      ]).catch(error => {
        const {message} = error as {message: string}
        expect(stripAnsi(message)).to.contain('Error: cannot update permissions. The app myapp is not owned by a team')
      })
    })
  })
})

*/
