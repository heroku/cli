'use strict'
/* globals beforeEach commands */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('chai').expect
const cmd = commands.find(c => c.topic === 'notifications' && !c.command)
const time = require('../../../../../src/time')
const unwrap = require('../../../../unwrap.js')

describe('notifications', () => {
  beforeEach(() => cli.mockConsole())

  describe('no notifications', () => {
    describe('with app', () => {
      it('warns about no read notifications', () => {
        let heroku = nock('https://api.heroku.com:443')
          .get('/apps/myapp').reply(200, {id: 'myapp', name: 'myapp'})
        let telex = nock('https://telex.heroku.com:443')
          .get('/user/notifications')
          .reply(200, [])
        return cmd.run({app: 'myapp', flags: {read: true}})
          .then(() => expect(cli.stdout).to.equal(''))
          .then(() => expect(unwrap(cli.stderr)).to.equal('You have no notifications on myapp. Run heroku notifications --all to view notifications for all apps.\n'))
          .then(() => heroku.done())
          .then(() => telex.done())
      })

      it('warns about no unread notifications', () => {
        let heroku = nock('https://api.heroku.com:443')
          .get('/apps/myapp').reply(200, {id: 'myapp', name: 'myapp'})
        let telex = nock('https://telex.heroku.com:443')
          .get('/user/notifications')
          .reply(200, [])
        return cmd.run({app: 'myapp', flags: {read: false}})
          .then(() => expect(cli.stdout).to.equal(''))
          .then(() => expect(unwrap(cli.stderr)).to.equal('No unread notifications on myapp. Run heroku notifications --all to view notifications for all apps.\n'))
          .then(() => heroku.done())
          .then(() => telex.done())
      })
    })

    describe('no app', () => {
      it('warns about no read notifications', () => {
        let telex = nock('https://telex.heroku.com:443')
          .get('/user/notifications')
          .reply(200, [])
        return cmd.run({flags: {read: true}})
          .then(() => expect(cli.stdout).to.equal(''))
          .then(() => expect(unwrap(cli.stderr)).to.equal('You have no notifications.\n'))
          .then(() => telex.done())
      })

      it('warns about no unread notifications', () => {
        let telex = nock('https://telex.heroku.com:443')
          .get('/user/notifications')
          .reply(200, [])
        return cmd.run({flags: {read: false}})
          .then(() => expect(cli.stdout).to.equal(''))
          .then(() => expect(unwrap(cli.stderr)).to.equal('No unread notifications. Run heroku notifications --read to view read notifications.\n'))
          .then(() => telex.done())
      })
    })
  })

  describe('with notifications', () => {
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

    it('shows all read app notifications', () => {
      let heroku = nock('https://api.heroku.com:443')
        .get('/apps/myapp')
        .reply(200, {id: 'myapp', name: 'myapp'})
      let telex = nock('https://telex.heroku.com:443')
        .get('/user/notifications')
        .reply(200, notifications)
      return cmd.run({app: 'myapp', flags: {read: true, json: false}})
        .then(() => expect(cli.stdout).to.equal(`=== Read Notifications for myapp

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
`))
        .then(() => expect(cli.stderr).to.equal(''))
        .then(() => heroku.done())
        .then(() => telex.done())
    })

    it('shows all unread notifications', () => {
      let telex = nock('https://telex.heroku.com:443')
        .get('/user/notifications')
        .reply(200, notifications)
        .patch('/user/notifications/101', {read: true})
        .reply(200)
      return cmd.run({flags: {json: false}})
        .then(() => expect(cli.stdout).to.equal(`=== Unread Notifications

title

  ${time.ago(d)}
  msg
  ${time.ago(d)}
  followup
`))
        .then(() => expect(cli.stderr).to.equal(''))
        .then(() => telex.done())
    })

    it('shows all read notifications as json', () => {
      let telex = nock('https://telex.heroku.com:443')
        .get('/user/notifications')
        .reply(200, notifications)
      return cmd.run({flags: {read: true, json: true}})
        .then(() => expect(JSON.parse(cli.stdout)[0].id).to.equal(101))
        .then(() => expect(cli.stderr).to.equal(''))
        .then(() => telex.done())
    })
  })
})
