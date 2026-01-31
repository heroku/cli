import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

import {unwrap} from '../../../helpers/utils/unwrap.js'

describe('notifications', function () {
  const d = new Date()
  const notifications = [
    {
      body: 'msg',
      created_at: d.toString(),
      followup: [
        {body: 'followup', created_at: d.toString()},
      ],
      id: 101,
      read: false,
      target: {id: 'myapp'},
      title: 'title',
    },
    {
      body: 'msg',
      created_at: d.toString(),
      followup: [
        {body: 'followup', created_at: d.toString()},
      ],
      id: 102,
      read: true,
      target: {id: 'myapp'},
      title: 'title2',
    },
  ]
  let api: nock.Scope
  let telexApi: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    telexApi = nock('https://telex.heroku.com')
  })

  afterEach(function () {
    telexApi.done()
    api.done()
    nock.cleanAll()
  })

  describe('no notifications', function () {
    describe('with app', function () {
      it('warns about no read notifications', async function () {
        api
          .get('/apps/myapp')
          .reply(200, {id: 'myapp', name: 'myapp'})
        telexApi
          .get('/user/notifications')
          .reply(200, [])

        const {stderr, stdout} = await runCommand(['notifications', '-a', 'myapp', '--read'])

        expect(stdout).to.contain('You have no notifications on ⬢ myapp.\nRun heroku notifications --all to view notifications for all apps.\n')
        expect(unwrap(stderr)).to.be.empty
      })

      it('warns about no unread notifications', async function () {
        api
          .get('/apps/myapp')
          .reply(200, {id: 'myapp', name: 'myapp'})
        telexApi
          .get('/user/notifications')
          .reply(200, [])

        const {stderr, stdout} = await runCommand(['notifications', '-a', 'myapp'])

        expect(stdout).to.contain('No unread notifications on ⬢ myapp.\nRun heroku notifications --all to view notifications for all apps.\n')
        expect(unwrap(stderr)).to.be.empty
      })
    })

    describe('no app', function () {
      it('warns about no read notifications', async function () {
        telexApi
          .get('/user/notifications')
          .reply(200, [])

        const {stderr, stdout} = await runCommand(['notifications', '--read'])

        expect(stdout).to.contain('You have no notifications.\n')
        expect(unwrap(stderr)).to.be.empty
      })

      it('warns about no unread notifications', async function () {
        telexApi
          .get('/user/notifications')
          .reply(200, [])

        const {stderr, stdout} = await runCommand(['notifications'])

        expect(stdout).to.contain('No unread notifications.\nRun heroku notifications --read to view read notifications.\n')
        expect(unwrap(stderr)).to.be.empty
      })
    })

    describe('with notifications', function () {
      it('shows all read app notifications', async function () {
        api
          .get('/apps/myapp')
          .reply(200, {id: 'myapp', name: 'myapp'})
        telexApi
          .get('/user/notifications')
          .reply(200, notifications)

        const {stderr, stdout} = await runCommand(['notifications', '-a', 'myapp', '--read'])

        expect(stdout).to.contain('=== Read Notifications for ⬢ myapp')
        expect(stdout).to.contain('ago')
        expect(stdout).to.contain('title')
        expect(stdout).to.contain('msg')
        expect(stdout).to.contain('followup')
        expect(stdout).to.contain('title2')
        expect(unwrap(stderr)).to.be.empty
      })

      it('shows all unread notifications', async function () {
        telexApi
          .get('/user/notifications')
          .reply(200, notifications)
          .patch('/user/notifications/101', {read: true})
          .reply(200)

        const {stderr, stdout} = await runCommand(['notifications'])

        expect(stdout).to.contain('=== Unread Notifications')
        expect(stdout).to.contain('ago')
        expect(stdout).to.contain('title')
        expect(stdout).to.contain('msg')
        expect(stdout).to.contain('followup')
        expect(stdout).to.not.contain('title2')
        expect(unwrap(stderr)).to.be.empty
      })

      it('shows all read notifications as json', async function () {
        telexApi
          .get('/user/notifications')
          .reply(200, notifications)

        const {stderr, stdout} = await runCommand(['notifications', '--read', '--json'])

        expect(JSON.parse(stdout)[0].id).to.equal(101)
        expect(unwrap(stderr)).to.be.empty
      })
    })
  })
})
