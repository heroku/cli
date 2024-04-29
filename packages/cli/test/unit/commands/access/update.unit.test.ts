import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/access/update'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import {personalApp, teamApp} from '../../../helpers/stubs/get'
import {appCollaboratorWithPermissions} from '../../../helpers/stubs/patch'
import expectOutput from '../../../helpers/utils/expectOutput'
import stripAnsi = require('strip-ansi')

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
      expectOutput(stdout.output, '')
      expectOutput(stderr.output, `
Updating gandalf@heroku.com in application myapp with deploy,view permissions...
Updating gandalf@heroku.com in application myapp with deploy,view permissions... done
`)
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
      expectOutput(stdout.output, '')
      expectOutput(stderr.output, `
Updating gandalf@heroku.com in application myapp with deploy,view permissions...
Updating gandalf@heroku.com in application myapp with deploy,view permissions... done
`)
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
