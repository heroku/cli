'use strict'
/* globals describe beforeEach afterEach it context */

let cmd = require('../../commands/status')
let moment = require('moment')
let time = moment().subtract(5, 'minutes')
let cli = require('heroku-cli-util')
let nock = require('nock')
let expect = require('unexpected')

describe('heroku status', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  context('when heroku is green', () => {
    it('shows success message', () => {
      let api = nock('https://status.heroku.com:443')
        .get('/api/v4/current-status')
        .reply(200, {
          status: [
            { system: 'Apps', status: 'green' },
            { system: 'Data', status: 'green' },
            { system: 'Tools', status: 'green' }
          ],
          incidents: [],
          scheduled: []
        })

      return cmd.run({flags: {}})
          .then(() => {
            expect(`Apps:      No known issues at this time.
Data:      No known issues at this time.
Tools:     No known issues at this time.
`, 'to equal', cli.stdout)
          })
        .then(() => api.done())
    })
  })

  context('when heroku has issues', () => {
    it('shows the issues', () => {
      let api = nock('https://status.heroku.com:443')
        .get('/api/v4/current-status')
        .reply(200, {
          status: [
            { system: 'Apps', status: 'red' },
            { system: 'Data', status: 'green' },
            { system: 'Tools', status: 'green' }
          ],
          incidents: [{
            title: 'incident title',
            created_at: time.toISOString(),
            full_url: 'https://status.heroku.com',
            updates: [
              {update_type: 'update type', updated_at: time.toISOString(), contents: 'update contents'}
            ]}
          ],
          scheduled: []
        })

      return cmd.run({flags: {}})
        .then(() => {
          expect(`Apps:      Red
Data:      No known issues at this time.
Tools:     No known issues at this time.

=== incident title ${moment(time).format('LT')} https://status.heroku.com
update type  ${moment(time).format('LT')} (5 minutes ago)
update contents

`, 'to equal', cli.stdout)
        })
        .then(() => api.done())
    })
  })
})
