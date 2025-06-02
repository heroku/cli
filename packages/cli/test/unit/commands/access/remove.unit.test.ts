// import {stdout, stderr} from 'stdout-stderr'
import nock from 'nock'
import {expect} from 'chai'
// import Cmd from '../../../../src/commands/access/remove.js'
import {runCommand} from '@oclif/test'
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
      const {stdout, stderr} = await runCommand(['access:remove', '--app', 'myapp', 'gandalf@heroku.com'])

      // await runCommand(Cmd, [
      //   '--app',
      //   'myapp',
      //   'gandalf@heroku.com',
      // ])
      apiDelete.done()
      expect('').to.eq(stdout)
      expect(stderr).to.include('Removing gandalf@heroku.com access from the app myapp... done')
    })
  })
})
