'use strict'
/* globals beforeEach context */

let fixtures = require('../../../fixtures')
let util = require('../../../util')
let cli = require('heroku-cli-util')
let nock = require('nock')
const {expect} = require('chai')
let cmd = require('../../../../commands/addons/rename')

describe('addons:rename', () => {
  beforeEach(() => {
    cli.mockConsole()
  })

  let redis = fixtures.addons['www-redis']

  context('when the add-on exists', () => {
    it('renames the add-on', () => {
      nock('https://api.heroku.com')
        .get(`/addons/${redis.name}`)
        .reply(200, redis)

      let renameRequest = nock('https://api.heroku.com')
        .patch(`/apps/${redis.app.id}/addons/${redis.id}`, {name: 'cache-redis'})
        .reply(201, '')

      return cmd.run({flags: {}, args: {addon: redis.name, name: 'cache-redis'}}).then(() => {
        expect(renameRequest.isDone()).to.equal(true)
        util.expectOutput(cli.stdout, `${redis.name} successfully renamed to cache-redis.`)
      })
    })
  })

  context('when the add-on does not exist', () => {
    it('displays an appropriate error', () => {
      nock('https://api.heroku.com')
        .get('/addons/not-an-addon')
        .reply(404, {message: "Couldn't find that add-on.", id: 'not_found', resource: 'addon'})

      return cmd.run({flags: {}, args: {addon: 'not-an-addon', name: 'cache-redis'}})
        .then(() => {
          throw new Error('unreachable')
        })
        .catch(error => expect(error, 'to satisfy', {body: {message: "Couldn't find that add-on."}}))
    })
  })
})
