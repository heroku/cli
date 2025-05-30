import {stdout, stderr} from 'stdout-stderr'
import nock from 'nock'
import {expect} from 'chai'
import Cmd from '../../../../src/commands/access/remove.js'
import runCommand from '../../../helpers/runCommand.js'
import {collaboratorsPersonalApp} from '../../../helpers/stubs/delete.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'
import tsheredoc from 'tsheredoc'
const heredoc = tsheredoc.default

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
      apiDelete.done()
      expect('').to.eq(stdout.output)
      expect(stderr.output).to.include('Removing gandalf@heroku.com access from the app myapp... done')
    })
  })
})
