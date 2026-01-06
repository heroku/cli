import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import {
  herokuDataAppsToolsIncidentResponse,
  herokuMaintenanceResponse,
  instancesResponse,
  nonHerokuIncidentResponse,
  trustLocalizationsResponse,
  fixtureNowISO,
  fixtureNow,
} from '../../fixtures/status/fixtures.js'

const herokuStatusApi = 'https://status.heroku.com:443'
const salesforceTrustApi = 'https://api.status.salesforce.com/v1'

describe('status - Heroku Status API', function () {
  afterEach(() => nock.cleanAll())

  describe('when heroku is green', function () {
    it('shows success message', async () => {
      nock(herokuStatusApi)
        .get('/api/v4/current-status')
        .reply(200, {
          status: [
            {system: 'Apps', status: 'green'},
            {system: 'Data', status: 'green'},
            {system: 'Tools', status: 'green'},
          ],
          incidents: [],
          scheduled: [],
        })

      const {stdout} = await runCommand(['status'])

      expect(stdout).to.equal(`Apps:      No known issues at this time.
Data:      No known issues at this time.
Tools:     No known issues at this time.\n`)
    })

    it('--json', async () => {
      nock(herokuStatusApi)
        .get('/api/v4/current-status')
        .reply(200, {
          status: [
            {system: 'Apps', status: 'green'},
            {system: 'Data', status: 'green'},
            {system: 'Tools', status: 'green'},
          ],
          incidents: [],
          scheduled: [],
        })

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

    it('shows the issues', async () => {
      nock(herokuStatusApi)
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

describe('status - SF Trust API', function () {
  afterEach(() => nock.cleanAll())

  describe('when there are no Heroku incidents', function () {
    it('shows success message', async () => {
      nock(herokuStatusApi)
        .get('/api/v4/current-status')
        .reply(404)
      nock(salesforceTrustApi)
        .get('/instances?products=Heroku')
        .reply(200, instancesResponse)
        .get('/incidents/active')
        .reply(200, nonHerokuIncidentResponse)
        .get('/maintenances')
        .query(params => params.limit === '10' && params.offset === '0' && params.product === 'Heroku' && params.locale === 'en')
        .reply(200)
        .get('/localizations?locale=en')
        .reply(200, trustLocalizationsResponse)

      const {stdout} = await runCommand(['status'])

      expect(stdout).to.equal(`Apps:      No known issues at this time.
Data:      No known issues at this time.
Tools:     No known issues at this time.\n`)
    })

    it('returns json response with --json flag', async () => {
      nock(herokuStatusApi)
        .get('/api/v4/current-status')
        .reply(404)
      nock(salesforceTrustApi)
        .get('/instances?products=Heroku')
        .reply(200, instancesResponse)
        .get('/incidents/active')
        .reply(200, nonHerokuIncidentResponse)
        .get('/maintenances')
        .query(params => params.limit === '10' && params.offset === '0' && params.product === 'Heroku' && params.locale === 'en')
        .reply(200)
        .get('/localizations?locale=en')
        .reply(200, trustLocalizationsResponse)

      const {stdout} = await runCommand(['status', '--json'])

      expect(JSON.parse(stdout).status[0]).to.deep.include({status: 'green'})
    })

    it('includes planned maintenances in the json response with --json flag', async () => {
      nock(herokuStatusApi)
        .get('/api/v4/current-status')
        .reply(404)
      nock(salesforceTrustApi)
        .get('/instances?products=Heroku')
        .reply(200, instancesResponse)
        .get('/incidents/active')
        .reply(200, nonHerokuIncidentResponse)
        .get('/maintenances')
        .query(params => params.limit === '10' && params.offset === '0' && params.product === 'Heroku' && params.locale === 'en')
        .reply(200, herokuMaintenanceResponse)
        .get('/localizations?locale=en')
        .reply(200, trustLocalizationsResponse)

      const {stdout} = await runCommand(['status', '--json'])

      expect(JSON.parse(stdout).scheduled).to.deep.equal(herokuMaintenanceResponse)
    })
  })

  describe('when there are active Heroku incidents', function () {
    before(function () {
      sinon.stub(Date, 'now').returns(fixtureNow)
    })

    after(function () {
      sinon.restore()
    })

    it('shows the issues', async () => {
      nock(herokuStatusApi)
        .get('/api/v4/current-status')
        .reply(404)
      nock(salesforceTrustApi)
        .get('/instances?products=Heroku')
        .reply(200, instancesResponse)
        .get('/incidents/active')
        .reply(200, herokuDataAppsToolsIncidentResponse)
        .get('/maintenances')
        .query(params => params.limit === '10' && params.offset === '0' && params.product === 'Heroku' && params.locale === 'en')
        .reply(200)
        .get('/localizations?locale=en')
        .reply(200, trustLocalizationsResponse)

      const {stdout} = await runCommand(['status'])

      expect(stdout).to.equal(`Apps:      Yellow
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
    it('displays an error message', async () => {
      nock(herokuStatusApi)
        .get('/api/v4/current-status')
        .reply(404)
      nock(salesforceTrustApi)
        .get('/instances?products=Heroku')
        .reply(404, instancesResponse)
        .get('/incidents/active')
        .reply(200, herokuDataAppsToolsIncidentResponse)
        .get('/maintenances')
        .query(params => params.limit === '10' && params.offset === '0' && params.product === 'Heroku' && params.locale === 'en')
        .reply(200)
        .get('/localizations?locale=en')
        .reply(200, trustLocalizationsResponse)

      const {error} = await runCommand(['status'])

      expect(error?.message).to.include('Heroku platform status is unavailable at this time. Refer to https://status.salesforce.com/products/Heroku or try again later.')
    })
  })
})
