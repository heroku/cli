import {stdout, stderr} from 'stdout-stderr'
import nock from 'nock'
import {expect} from 'chai'
import Cmd from '../../../../src/commands/access/remove.js'
import runCommand from '../../../helpers/runCommand.js'
import {collaboratorsPersonalApp} from '../../../helpers/stubs/delete.js'

describe('heroku access:remove', function () {
  let apiDelete: { done: () => any }

  context('with either a personal or org app', function () {
    beforeEach(function () {
      apiDelete = collaboratorsPersonalApp('myapp', 'gandalf@heroku.com')
    })

    afterEach(function () {
      return nock.cleanAll()
    })

    it('removes the user from an app', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'gandalf@heroku.com',
      ])
      expect('').to.eq(stdout.output)
      expect('Removing gandalf@heroku.com access from the app myapp... done\n').to.eq(stderr.output)
      apiDelete.done()
    })
  })
})
