import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import * as sinon from 'sinon'

describe('status', function () {
  beforeEach(function () {
    nock.cleanAll()
  })

  afterEach(function () {
    nock.cleanAll()
  })

  describe('when heroku is green', function () {
    const greenStatus = {
      status: [
        {system: 'Apps', status: 'green'},
        {system: 'Data', status: 'green'},
        {system: 'Tools', status: 'green'},
      ],
      incidents: [],
      scheduled: [],
    }

    beforeEach(function () {
      nock('https://status.heroku.com')
        .get('/api/v4/current-status')
        .reply(200, greenStatus)
    })

    it('shows success message', async function () {
      const {stdout} = await runCommand(['status'])
      expect(stdout).to.equal(`Apps:      No known issues at this time.
Data:      No known issues at this time.
Tools:     No known issues at this time.\n`)
    })

    it('--json', async function () {
      const {stdout} = await runCommand(['status', '--json'])
      expect(JSON.parse(stdout).status[0]).to.deep.include({status: 'green'})
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

    beforeEach(function () {
      nock('https://status.heroku.com')
        .get('/api/v4/current-status')
        .reply(200, {
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

    it('shows the issues', async function () {
      const {stdout} = await runCommand(['status'])
      expect(stdout).to.equal(`Apps:      Red
Data:      No known issues at this time.
Tools:     No known issues at this time.

=== incident title ${timeISO} https://status.heroku.com

update type ${timeISO} (less than a minute ago)
update contents

`)
    })
  })
})
