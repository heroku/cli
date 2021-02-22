'use strict'
/* globals describe beforeEach it commands */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('chai').expect
const cmd = commands.find((c) => c.topic === 'notifications' && !c.command)
const time = require('../../../../src/time')
const unwrap = require('../../../unwrap.js')

describe('notifications', () => {
  beforeEach(() => cli.mockConsole())

  describe('no notifications', () => {
    describe('with app', () => {
      it('warns about no read notifications', async () => {
        let heroku = nock('https://api.heroku.com:443')
          .get('/apps/myapp').reply(200, { id: 'myapp', name: 'myapp' })
        let telex = nock('https://telex.heroku.com:443')
          .get('/user/notifications')
          .reply(200, [])

        await cmd.run({ app: 'myapp', flags: { read: true } })

        expect(cli.stdout).to.equal('');
        expect(unwrap(cli.stderr)).to.equal('You have no notifications on myapp. Run heroku notifications --all to view notifications for all apps.\n');
        heroku.done();

        return telex.done()
      })

      it('warns about no unread notifications', async () => {
        let heroku = nock('https://api.heroku.com:443')
          .get('/apps/myapp').reply(200, { id: 'myapp', name: 'myapp' })
        let telex = nock('https://telex.heroku.com:443')
          .get('/user/notifications')
          .reply(200, [])

        await cmd.run({ app: 'myapp', flags: { read: false } })

        expect(cli.stdout).to.equal('');
        expect(unwrap(cli.stderr)).to.equal('No unread notifications on myapp. Run heroku notifications --all to view notifications for all apps.\n');
        heroku.done();

        return telex.done()
      })
    })

    describe('no app', () => {
      it('warns about no read notifications', async () => {
        let telex = nock('https://telex.heroku.com:443')
          .get('/user/notifications')
          .reply(200, [])

        await cmd.run({ flags: { read: true } })

        expect(cli.stdout).to.equal('');
        expect(unwrap(cli.stderr)).to.equal('You have no notifications.\n');

        return telex.done()
      })

      it('warns about no unread notifications', async () => {
        let telex = nock('https://telex.heroku.com:443')
          .get('/user/notifications')
          .reply(200, [])

        await cmd.run({ flags: { read: false } })

        expect(cli.stdout).to.equal('');
        expect(unwrap(cli.stderr)).to.equal('No unread notifications. Run heroku notifications --read to view read notifications.\n');

        return telex.done()
      })
    })
  })

  describe('with notifications', () => {
    const d = new Date()
    const notifications = [
      {
        id: 101,
        title: 'title',
        target: { id: 'myapp' },
        created_at: d.toString(),
        read: false,
        body: 'msg',
        followup: [
          { body: 'followup', created_at: d.toString() }
        ]
      },
      {
        id: 102,
        title: 'title2',
        target: { id: 'myapp' },
        created_at: d.toString(),
        read: true,
        body: 'msg',
        followup: [
          { body: 'followup', created_at: d.toString() }
        ]
      }
    ]

    it('shows all read app notifications', async () => {
      let heroku = nock('https://api.heroku.com:443')
        .get('/apps/myapp')
        .reply(200, { id: 'myapp', name: 'myapp' })
      let telex = nock('https://telex.heroku.com:443')
        .get('/user/notifications')
        .reply(200, notifications)

      await cmd.run({ app: 'myapp', flags: { read: true, json: false } })

      expect(cli.stdout).to.equal(`=== Read Notifications for myapp

title

  ${time.ago(d)}
  msg
  ${time.ago(d)}
  followup

title2

  ${time.ago(d)}
  msg
  ${time.ago(d)}
  followup
`);

      expect(cli.stderr).to.equal('');
      heroku.done();

      return telex.done()
    })

    it('shows all unread notifications', async () => {
      let telex = nock('https://telex.heroku.com:443')
        .get('/user/notifications')
        .reply(200, notifications)
        .patch('/user/notifications/101', { read: true })
        .reply(200)

      await cmd.run({ flags: { json: false } })

      expect(cli.stdout).to.equal(`=== Unread Notifications

title

  ${time.ago(d)}
  msg
  ${time.ago(d)}
  followup
`);

      expect(cli.stderr).to.equal('');

      return telex.done()
    })

    it('shows all read notifications as json', async () => {
      let telex = nock('https://telex.heroku.com:443')
        .get('/user/notifications')
        .reply(200, notifications)

      await cmd.run({ flags: { read: true, json: true } })

      expect(JSON.parse(cli.stdout)[0].id).to.equal(101);
      expect(cli.stderr).to.equal('');

      return telex.done()
    })
  })
})
