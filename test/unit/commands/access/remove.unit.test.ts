import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../src/commands/access/remove.js'
import {collaboratorsPersonalApp} from '../../../helpers/stubs/delete.js'

describe('heroku access:remove', function () {
  let apiDelete: {done: () => any}

  context('with either a personal or org app', function () {
    beforeEach(function () {
      apiDelete = collaboratorsPersonalApp('myapp', 'gandalf@heroku.com')
    })

    afterEach(function () {
      return nock.cleanAll()
    })

    it('removes the user from an app', async function () {
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'myapp',
        'gandalf@heroku.com',
      ])
      apiDelete.done()
      expect('').to.eq(stdout)
      expectOutput(stderr, 'Removing gandalf@heroku.com access from the app ⬢ myapp... done\n')
    })
  })
})
