import {expect, test} from '@oclif/test'
import * as time from '../../../../src/lib/notifications/time'
import {unwrap} from '../../../helpers/utils/unwrap'

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

describe('notifications', () => {
  describe('no notifications', () => {
    describe('with app', () => {
      test
        .stdout()
        .stderr()
        .nock('https://api.heroku.com:443', api => api
          .get('/apps/myapp')
          .reply(200, {id: 'myapp', name: 'myapp'}),
        )
        .nock('https://telex.heroku.com:443', api => api
          .get('/user/notifications')
          .reply(200, []),
        )
        .command(['notifications', '-a', 'myapp', '--read'])
        .it('warns about no read notifications', ({stdout, stderr}) => {
          expect(stdout).to.be.empty
          expect(unwrap(stderr)).to.contain(' ▸    You have no notifications on myapp.\n ▸    Run heroku notifications --all to view notifications for all\n ▸    apps.\n')
        })

      test
        .stdout()
        .stderr()
        .nock('https://api.heroku.com:443', api => api
          .get('/apps/myapp')
          .reply(200, {id: 'myapp', name: 'myapp'}),
        )
        .nock('https://telex.heroku.com:443', api => api
          .get('/user/notifications')
          .reply(200, []),
        )
        .command(['notifications', '-a', 'myapp'])
        .it('warns about no unread notifications', ({stdout, stderr}) => {
          expect(stdout).to.be.empty
          expect(unwrap(stderr)).to.contain(' ▸    No unread notifications on myapp.\n ▸    Run heroku notifications --all to view\n ▸    notifications for all apps.\n')
        })
    })

    describe('no app', () => {
      test
        .stdout()
        .stderr()
        .nock('https://telex.heroku.com:443', api => api
          .get('/user/notifications')
          .reply(200, []),
        )
        .command(['notifications', '--read'])
        .it('warns about no read notifications', ({stdout, stderr}) => {
          expect(stdout).to.be.empty
          expect(unwrap(stderr)).to.contain('You have no notifications.\n')
        })

      test
        .stdout()
        .stderr()
        .nock('https://telex.heroku.com:443', api => api
          .get('/user/notifications')
          .reply(200, []),
        )
        .command(['notifications'])
        .it('warns about no unread notifications', ({stdout, stderr}) => {
          expect(stdout).to.be.empty
          expect(unwrap(stderr)).to.contain(' ▸    No unread notifications.\n ▸    Run heroku notifications --read to view read\n ▸    notifications.\n')
        })
    })

    describe('with notifications', () => {
      test
        .stdout()
        .stderr()
        .nock('https://api.heroku.com:443', api => api
          .get('/apps/myapp')
          .reply(200, {id: 'myapp', name: 'myapp'}),
        )
        .nock('https://telex.heroku.com:443', api => api
          .get('/user/notifications')
          .reply(200, notifications),
        )
        .command(['notifications', '-a', 'myapp', '--read'])
        .it('shows all read app notifications', ({stdout, stderr}) => {
          expect(stdout).to.contain('=== Read Notifications for ⬢ myapp\n')
          expect(stdout).to.contain('ago')
          expect(stdout).to.contain('title')
          expect(stdout).to.contain('msg')
          expect(stdout).to.contain('followup')
          expect(stdout).to.contain('title2')
          expect(unwrap(stderr)).to.be.empty
        })

      test
        .stdout()
        .stderr()
        .nock('https://telex.heroku.com:443', api => api
          .get('/user/notifications')
          .reply(200, notifications)
          .patch('/user/notifications/101', {read: true})
          .reply(200)
        )
        .command(['notifications'])
        .it('shows all unread notifications', ({stdout, stderr}) => {
          expect(stdout).to.contain('=== Unread Notifications')
          expect(stdout).to.contain('ago')
          expect(stdout).to.contain('title')
          expect(stdout).to.contain('msg')
          expect(stdout).to.contain('followup')
          expect(stdout).to.not.contain('title2')
          expect(unwrap(stderr)).to.be.empty
        })
    })
  })
})
