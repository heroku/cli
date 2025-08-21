import * as nock from 'nock'
import * as sinon from 'sinon'
import {expect, test} from '@oclif/test'
import {
  herokuDataAppsToolsIncidentResponse,
  herokuMaintenanceResponse,
  instancesResponse,
  nonHerokuIncidentResponse,
  trustLocalizationsResponse,
  fixtureNowISO,
  fixtureNow,
} from '../../fixtures/status/fixtures'

const herokuStatusApi = 'https://status.heroku.com:443'
const salesforceTrustApi = 'https://api.status.salesforce.com/v1'

describe('status - Heroku Status API', () => {
  describe('when heroku is green', function () {
    test
      .stdout()
      .nock(herokuStatusApi, api => {
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
      .nock(herokuStatusApi, api => {
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
      .nock(herokuStatusApi, api => {
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
})

describe('status - SF Trust API', function () {
  describe('when there are no Heroku incidents', function () {
    test
      .stdout()
      .nock(herokuStatusApi, api => {
        api.get('/api/v4/current-status').reply(404)
      })
      .nock(salesforceTrustApi, api => {
        api.get('/instances?products=Heroku').reply(200, instancesResponse)
        api.get('/incidents/active').reply(200, nonHerokuIncidentResponse)
        api.get('/maintenances')
          .query(params => {
            return params.limit === '10' && params.offset === '0' && params.product === 'Heroku' && params.locale === 'en'
          })
          .reply(200)
        api.get('/localizations?locale=en').reply(200, trustLocalizationsResponse)
      })
      .command(['status'])
      .it('shows success message', ctx => {
        expect(ctx.stdout).to.equal(`Apps:      No known issues at this time.
Data:      No known issues at this time.
Tools:     No known issues at this time.\n`)
      })

    test
      .stdout()
      .nock(herokuStatusApi, api => {
        api.get('/api/v4/current-status').reply(404)
      })
      .nock(salesforceTrustApi, api => {
        api.get('/instances?products=Heroku').reply(200, instancesResponse)
        api.get('/incidents/active').reply(200, nonHerokuIncidentResponse)
        api.get('/maintenances')
          .query(params => {
            return params.limit === '10' && params.offset === '0' && params.product === 'Heroku' && params.locale === 'en'
          })
          .reply(200)
        api.get('/localizations?locale=en').reply(200, trustLocalizationsResponse)
      })
      .command(['status', '--json'])
      .it('returns json response with --json flag', ctx => {
        expect(JSON.parse(ctx.stdout).status[0]).to.deep.include({status: 'green'})
      })

    test
      .stdout()
      .nock(herokuStatusApi, api => {
        api.get('/api/v4/current-status').reply(404)
      })
      .nock(salesforceTrustApi, api => {
        api.get('/instances?products=Heroku').reply(200, instancesResponse)
        api.get('/incidents/active').reply(200, nonHerokuIncidentResponse)
        api.get('/maintenances')
          .query(params => {
            return params.limit === '10' && params.offset === '0' && params.product === 'Heroku' && params.locale === 'en'
          })
          .reply(200, herokuMaintenanceResponse)
        api.get('/localizations?locale=en').reply(200, trustLocalizationsResponse)
      })
      .command(['status', '--json'])
      .it('includes planned maintenances in the json response with --json flag', ctx => {
        expect(JSON.parse(ctx.stdout).scheduled).to.deep.equal(herokuMaintenanceResponse)
      })
  })

  describe('when there are active Heroku incidents', function () {
    before(function () {
      sinon.stub(Date, 'now').returns(fixtureNow)
    })

    after(function () {
      sinon.restore()
    })

    test
      .stdout()
      .nock(herokuStatusApi, api => {
        api.get('/api/v4/current-status').reply(404)
      })
      .nock(salesforceTrustApi, api => {
        api.get('/instances?products=Heroku').reply(200, instancesResponse)
        api.get('/incidents/active').reply(200, herokuDataAppsToolsIncidentResponse)
        api.get('/maintenances')
          .query(params => {
            return params.limit === '10' && params.offset === '0' && params.product === 'Heroku' && params.locale === 'en'
          })
          .reply(200)
        api.get('/localizations?locale=en').reply(200, trustLocalizationsResponse)
      })
      .command(['status'])
      .it('shows the issues', ctx => {
        expect(ctx.stdout).to.equal(`Apps:      Yellow
Data:      Red
Tools:     Yellow

=== 12345 ${fixtureNowISO} https://status.salesforce.com/incidents/12345

Heroku - Incident             ${fixtureNowISO} (less than a minute ago)
Incident update 1

Heroku Incident - Monitoring  ${fixtureNowISO} (less than a minute ago)
Incident update 2

Heroku Update - Investigating ${fixtureNowISO} (less than a minute ago)
Incident update 3


=== 12345 ${fixtureNowISO} https://status.salesforce.com/incidents/12345

Heroku - Incident             ${fixtureNowISO} (less than a minute ago)
Incident update 1

Heroku Incident - Monitoring  ${fixtureNowISO} (less than a minute ago)
Incident update 2

Heroku Update - Investigating ${fixtureNowISO} (less than a minute ago)
Incident update 3


=== 12345 ${fixtureNowISO} https://status.salesforce.com/incidents/12345

Heroku - Incident             ${fixtureNowISO} (less than a minute ago)
Incident update 1

Heroku Incident - Monitoring  ${fixtureNowISO} (less than a minute ago)
Incident update 2

Heroku Update - Investigating ${fixtureNowISO} (less than a minute ago)
Incident update 3

`)
      })
  })

  describe('when calls to both the Heroku Status API and the SF Trust API fail', function () {
    test
      .stdout()
      .nock(herokuStatusApi, api => {
        api.get('/api/v4/current-status').reply(404)
      })
      .nock(salesforceTrustApi, api => {
        api.get('/instances?products=Heroku').reply(404, instancesResponse)
        api.get('/incidents/active').reply(200, herokuDataAppsToolsIncidentResponse)
        api.get('/maintenances')
          .query(params => {
            return params.limit === '10' && params.offset === '0' && params.product === 'Heroku' && params.locale === 'en'
          })
          .reply(200)
        api.get('/localizations?locale=en').reply(200, trustLocalizationsResponse)
      })
      .command(['status'])
      .catch((error: any) => {
        expect(error.message).to.include('Heroku platform status is unavailable at this time. Refer to https://status.salesforce.com/products/Heroku or try again later.')
      })
      .it('displays an error message')
  })
})
