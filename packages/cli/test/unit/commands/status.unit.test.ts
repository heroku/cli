import * as nock from 'nock'

import {expect, test as base} from '@oclif/test'

const test = base

const api = nock('https://status.heroku.com:443')

beforeEach(() => nock.cleanAll())
afterEach(() => api.done())

describe('when heroku is green', () => {
  test
    .stdout()
    .nock('https://status.heroku.com', api => {
      api.get('/api/v4/current-status').reply(200, {
        status: [
          {system: 'Apps', status: 'green'},
          {system: 'Data', status: 'green'},
          {system: 'Tools', status: 'green'},
        ],
        incidents: [],
        scheduled: [],
      })
    })
    .command(['status'])
    .it('shows success message', ctx => {
      expect(ctx.stdout).to.equal(`Apps:      No known issues at this time.
Data:      No known issues at this time.
Tools:     No known issues at this time.\n`)
    })

  test
    .stdout()
    .nock('https://status.heroku.com', api => {
      api.get('/api/v4/current-status').reply(200, {
        status: [
          {system: 'Apps', status: 'green'},
          {system: 'Data', status: 'green'},
          {system: 'Tools', status: 'green'},
        ],
        incidents: [],
        scheduled: [],
      })
    })
    .command(['status', '--json'])
    .it('--json', ctx => {
      expect(JSON.parse(ctx.stdout).status[0]).to.deep.include({status: 'green'})
    })
})

describe('when heroku has issues', () => {
  const time = new Date()
  test
    .stdout()
    .nock('https://status.heroku.com', api => {
      api.get('/api/v4/current-status').reply(200, {
        status: [
          {system: 'Apps', status: 'red'},
          {system: 'Data', status: 'green'},
          {system: 'Tools', status: 'green'},
        ],
        incidents: [
          {
            title: 'incident title',
            created_at: time.toISOString(),
            full_url: 'https://status.heroku.com',
            updates: [{update_type: 'update type', updated_at: time.toISOString(), contents: 'update contents'}],
          },
        ],
        scheduled: [],
      })
    })
    .command(['status'])
    .it('shows the issues', ctx => {
      expect(ctx.stdout).to.equal(`Apps:      Red
Data:      No known issues at this time.
Tools:     No known issues at this time.

=== incident title ${time.toISOString()} https://status.heroku.com

update type ${time.toISOString()} (less than a minute ago)
update contents

`)
    })
})
