import * as nock from 'nock'
import * as sinon from 'sinon'
import {expect, test as base} from '@oclif/test'

const test = base

const api = nock('https://status.heroku.com:443')

beforeEach(function () {
  return nock.cleanAll()
})
afterEach(function () {
  return api.done()
})

describe('when heroku is green', function () {
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

describe('when heroku has issues', function () {
  const now = Date.now()
  const timeISO = new Date(now).toISOString()

  before(function () {
    sinon.stub(Date, 'now').returns(now)
  })

  after(function () {
    sinon.restore()
  })

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
            created_at: timeISO,
            full_url: 'https://status.heroku.com',
            updates: [{update_type: 'update type', updated_at: timeISO, contents: 'update contents'}],
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

=== incident title ${timeISO} https://status.heroku.com

update type ${timeISO} (less than a minute ago)
update contents

`)
    })
})
