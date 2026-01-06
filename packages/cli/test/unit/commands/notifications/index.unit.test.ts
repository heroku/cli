import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import {unwrap} from '../../../helpers/utils/unwrap.js'

const d = new Date()
const notifications = [
  {
    id: 101,
    title: 'title',
    target: {id: 'myapp'},
    created_at: d.toString(),
    read: false,
    body: 'msg',
    followup: [
      {body: 'followup', created_at: d.toString()},
    ],
  },
  {
    id: 102,
    title: 'title2',
    target: {id: 'myapp'},
    created_at: d.toString(),
    read: true,
    body: 'msg',
    followup: [
      {body: 'followup', created_at: d.toString()},
    ],
  },
]

describe('notifications', function () {
  afterEach(() => nock.cleanAll())

  describe('no notifications', function () {
    describe('with app', function () {
      it('warns about no read notifications', async () => {
        nock('https://api.heroku.com:443')
          .get('/apps/myapp')
          .reply(200, {id: 'myapp', name: 'myapp'})
        nock('https://telex.heroku.com:443')
          .get('/user/notifications')
          .reply(200, [])

        const {stdout, stderr} = await runCommand(['notifications', '-a', 'myapp', '--read'])

        expect(stdout).to.contain('You have no notifications on myapp.\nRun heroku notifications --all to view notifications for all apps.\n')
        expect(unwrap(stderr)).to.be.empty
      })

      it('warns about no unread notifications', async () => {
        nock('https://api.heroku.com:443')
          .get('/apps/myapp')
          .reply(200, {id: 'myapp', name: 'myapp'})
        nock('https://telex.heroku.com:443')
          .get('/user/notifications')
          .reply(200, [])

        const {stdout, stderr} = await runCommand(['notifications', '-a', 'myapp'])

        expect(stdout).to.contain('No unread notifications on myapp.\nRun heroku notifications --all to view notifications for all apps.\n')
        expect(unwrap(stderr)).to.be.empty
      })
    })

    describe('no app', function () {
      it('warns about no read notifications', async () => {
        nock('https://telex.heroku.com:443')
          .get('/user/notifications')
          .reply(200, [])

        const {stdout, stderr} = await runCommand(['notifications', '--read'])

        expect(stdout).to.contain('You have no notifications.\n')
        expect(unwrap(stderr)).to.be.empty
      })

      it('warns about no unread notifications', async () => {
        nock('https://telex.heroku.com:443')
          .get('/user/notifications')
          .reply(200, [])

        const {stdout, stderr} = await runCommand(['notifications'])

        expect(stdout).to.contain('No unread notifications.\nRun heroku notifications --read to view read notifications.\n')
        expect(unwrap(stderr)).to.be.empty
      })
    })

    describe('with notifications', function () {
      it('shows all read app notifications', async () => {
        nock('https://api.heroku.com:443')
          .get('/apps/myapp')
          .reply(200, {id: 'myapp', name: 'myapp'})
        nock('https://telex.heroku.com:443')
          .get('/user/notifications')
          .reply(200, notifications)

        const {stdout, stderr} = await runCommand(['notifications', '-a', 'myapp', '--read'])

        expect(stdout).to.contain('=== Read Notifications for ⬢ myapp')
        expect(stdout).to.contain('ago')
        expect(stdout).to.contain('title')
        expect(stdout).to.contain('msg')
        expect(stdout).to.contain('followup')
        expect(stdout).to.contain('title2')
        expect(unwrap(stderr)).to.be.empty
      })

      it('shows all unread notifications', async () => {
        nock('https://telex.heroku.com:443')
          .get('/user/notifications')
          .reply(200, notifications)
          .patch('/user/notifications/101', {read: true})
          .reply(200)

        const {stdout, stderr} = await runCommand(['notifications'])

        expect(stdout).to.contain('=== Unread Notifications')
        expect(stdout).to.contain('ago')
        expect(stdout).to.contain('title')
        expect(stdout).to.contain('msg')
        expect(stdout).to.contain('followup')
        expect(stdout).to.not.contain('title2')
        expect(unwrap(stderr)).to.be.empty
      })

      it('shows all read notifications as json', async () => {
        nock('https://telex.heroku.com:443')
          .get('/user/notifications')
          .reply(200, notifications)

        const {stdout, stderr} = await runCommand(['notifications', '--read', '--json'])

        expect(JSON.parse(stdout)[0].id).to.equal(101)
        expect(unwrap(stderr)).to.be.empty
      })
    })
  })
})
