import {stdout} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/addons/rename'
import runCommand from '../../../helpers/runCommand'
import * as fixtures from '../../../fixtures/addons/fixtures'
import * as nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput'
import {expect} from 'chai'

describe('addons:rename', () => {
  context('when the add-on exists', () => {
    let redis_name: string
    let renameRequest: nock.Scope

    beforeEach(function () {
      const redis = fixtures.addons['www-redis']!
      redis_name = redis.name!
      nock('https://api.heroku.com')
        .get(`/addons/${redis.name}`)
        .reply(200, redis)
      renameRequest = nock('https://api.heroku.com')
        .patch(`/apps/${redis.app?.id}/addons/${redis.id}`, {name: 'cache-redis'})
        .reply(201, '')
    })
    it('renames the add-on', async function () {
      await runCommand(Cmd, [redis_name, 'cache-redis'])
      expect(renameRequest.isDone()).to.equal(true)
      expectOutput(stdout.output, `${redis_name} successfully renamed to cache-redis.`)
    })
  })
  context('when the add-on does not exist', () => {
    it('displays an appropriate error', async function () {
      nock('https://api.heroku.com')
        .get('/addons/not-an-addon')
        .reply(404, {message: "Couldn't find that add-on.", id: 'not_found', resource: 'addon'})
      await runCommand(Cmd, ['not-an-addon', 'cache-redis'])
        .catch(error => expect(error.message).to.contain("Couldn't find that add-on."))
    })
  })
})
