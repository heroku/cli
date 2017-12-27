import * as moment from 'moment'
import * as nock from 'nock'

import Status from './status'

const time = moment().subtract(5, 'minutes')

let api = nock('https://status.heroku.com:443')

beforeEach(() => nock.cleanAll())
afterEach(() => api.done())

describe('when heroku is green', () => {
  beforeEach(() => {
    api.get('/api/v4/current-status').reply(200, {
      status: [
        { system: 'Apps', status: 'green' },
        { system: 'Data', status: 'green' },
        { system: 'Tools', status: 'green' },
      ],
      incidents: [],
      scheduled: [],
    })
  })

  test('shows success message', async () => {
    let { stdout, stderr } = await Status.mock()
    expect(stdout).toEqual(`Apps:      No known issues at this time.
Data:      No known issues at this time.
Tools:     No known issues at this time.\n`)
    expect(stderr).toEqual('')
  })

  test('--json', async () => {
    let { stdout, stderr } = await Status.mock(['--json'])
    expect(JSON.parse(stdout).status[0]).toMatchObject({ status: 'green' })
    expect(stderr).toEqual('')
  })
})

describe('when heroku has issues', () => {
  it('shows the issues', async () => {
    api.get('/api/v4/current-status').reply(200, {
      status: [
        { system: 'Apps', status: 'red' },
        { system: 'Data', status: 'green' },
        { system: 'Tools', status: 'green' },
      ],
      incidents: [
        {
          title: 'incident title',
          created_at: time.toISOString(),
          full_url: 'https://status.heroku.com',
          updates: [{ update_type: 'update type', updated_at: time.toISOString(), contents: 'update contents' }],
        },
      ],
      scheduled: [],
    })

    let { stdout } = await Status.mock()
    expect(stdout).toEqual(`Apps:      Red
Data:      No known issues at this time.
Tools:     No known issues at this time.

=== incident title ${moment(time).format('LT')} https://status.heroku.com
update type ${moment(time).format('LT')} (5 minutes ago)
update contents

`)
  })
})
