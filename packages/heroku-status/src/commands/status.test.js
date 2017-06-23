// @flow

import Status from './status'
import moment from 'moment'
import nock from 'nock'

const time = moment().subtract(5, 'minutes')

let api = nock('https://status.heroku.com:443')

beforeEach(() => nock.cleanAll())
afterEach(() => api.done())

describe('when heroku is green', () => {
  beforeEach(() => {
    api.get('/api/v4/current-status')
      .reply(200, {
        status: [
          { system: 'Apps', status: 'green' },
          { system: 'Data', status: 'green' },
          { system: 'Tools', status: 'green' }
        ],
        incidents: [],
        scheduled: []
      })
  })

  test('shows success message', async () => {
    let cmd = await Status.mock()
    expect(cmd.out.stdout.output).toEqual(`Apps:      No known issues at this time.
Data:      No known issues at this time.
Tools:     No known issues at this time.\n`)
    expect(cmd.out.stderr.output).toEqual('')
  })

  test('--json', async () => {
    let cmd = await Status.mock('--json')
    expect(JSON.parse(cmd.out.stdout.output).status[0]).toMatchObject({status: 'green'})
    expect(cmd.out.stderr.output).toEqual('')
  })
})

describe('when heroku has issues', () => {
  it('shows the issues', async () => {
    api.get('/api/v4/current-status')
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

    let cmd = await Status.mock()
    expect(cmd.out.stdout.output).toEqual(`Apps:      Red
Data:      No known issues at this time.
Tools:     No known issues at this time.

=== incident title ${moment(time).format('LT')} https://status.heroku.com
update type  ${moment(time).format('LT')} (5 minutes ago)
update contents

`)
  })
})
