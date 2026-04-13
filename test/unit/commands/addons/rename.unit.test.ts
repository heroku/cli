import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../src/commands/addons/rename.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'

describe('addons:rename', function () {
  context('when the add-on exists', function () {
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
      const {stdout} = await runCommand(Cmd, [redis_name, 'cache-redis'])
      expect(renameRequest.isDone()).to.equal(true)
      expectOutput(stdout, `${redis_name} successfully renamed to cache-redis.`)
    })
  })
  context('when the add-on does not exist', function () {
    it('displays an appropriate error', async function () {
      nock('https://api.heroku.com')
        .get('/addons/not-an-addon')
        .reply(404, {id: 'not_found', message: "Couldn't find that add-on.", resource: 'addon'})
      await runCommand(Cmd, ['not-an-addon', 'cache-redis'])
        .catch(error => expect(error.message).to.contain("Couldn't find that add-on."))
    })
  })
})
