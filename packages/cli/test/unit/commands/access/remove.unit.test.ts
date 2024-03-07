import {stdout, stderr} from 'stdout-stderr'
import * as nock from 'nock'
import {expect} from 'chai'
import Cmd  from '../../../../src/commands/access/remove'
import runCommand from '../../../helpers/runCommand'
import {collaboratorsPersonalApp} from '../../../helpers/stubs/delete'
let apiDelete: { done: () => any }
describe('heroku access:remove', () => {
  context('with either a personal or org app', () => {
    beforeEach(() => {
      apiDelete = collaboratorsPersonalApp('myapp', 'raulb@heroku.com')
    })
    afterEach(() => nock.cleanAll())
    it('removes the user from an app', () => {
      return runCommand(Cmd, [
        '--app',
        'myapp',
        'raulb@heroku.com',
      ])
        .then(() => expect('').to.eq(stdout.output))
        .then(() => expect(stderr.output).to.contain('Removing raulb@heroku.com access from the app myapp...\n'))
        .then(() => expect(stderr.output).to.contain('Removing raulb@heroku.com access from the app myapp... done\n'))
        .then(() => apiDelete.done())
    })
  })
})
