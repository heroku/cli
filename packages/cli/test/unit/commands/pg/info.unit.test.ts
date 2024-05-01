import {stdout, stderr} from 'stdout-stderr'
import {expect} from 'chai'
import * as nock from 'nock'
import * as sinon from 'sinon'
import * as fetcher from '../../../../src/lib/pg/fetcher'
import runCommand from '../../../helpers/runCommand'
const proxyquire = require('proxyquire')
let all = []
let addon
let allSinonStub: ReturnType<typeof sinon.stub>
let addonSinonStub: ReturnType<typeof sinon.stub>

const getCmd = (resultsObject: {allResult: any, addonResult: any}) => {
  const {allResult, addonResult} = resultsObject
  allSinonStub = sinon.stub(fetcher, 'all').returns(allResult)
  addonSinonStub = sinon.stub(fetcher, 'getAddon').returns(addonResult)
  const {default: Cmd} = proxyquire(
    '../../../../src/commands/pg/info',
    {
      getAddOn: addonSinonStub,
      all: allSinonStub,
    },
  )
  return Cmd
}

describe('pg', () => {
  let api: nock.Scope
  let pg: nock.Scope

  beforeEach(() => {
    api = nock('https://api.heroku.com:443')
    pg = nock('https://api.data.heroku.com:443')
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
    allSinonStub.restore()
    addonSinonStub.restore()
  })
  context('with 0 dbs', () => {
    it('shows empty state', async () => {
      const Cmd = getCmd({allResult: [], addonResult: {}})
      api.get('/apps/myapp/config-vars')
        .reply(200, {})
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(stdout.output).to.equal('myapp has no heroku-postgresql databases.\n')
      expect(stderr.output).to.equal('')
    })
  })
  context('with 2 dbs', () => {
    const plan = {name: 'heroku-postgresql:hobby-dev'}
    const config = {
      DATABASE_URL: 'postgres://uxxxxxxxxx:pxxxxxxxx@ec2-54-111-111-1.compute-1.amazonaws.com:5452/dxxxxxxxxxxxx', HEROKU_POSTGRESQL_COBALT_URL: 'postgres://uxxxxxxxxx:pxxxxxxxx@ec2-54-111-111-1.compute-1.amazonaws.com:5452/dxxxxxxxxxxxx', HEROKU_POSTGRESQL_PURPLE_URL: 'postgres://uxxxxxxxxx:pxxxxxxxx@ec3-54-111-111-1.compute-1.amazonaws.com:5452/dxxxxxxxxxxxx',
    }
    const addons = [
      {id: 1, name: 'postgres-1', plan, app: {name: 'myapp2'}}, {id: 2, name: 'postgres-2', plan, app: {name: 'myapp'}},
    ]
    const dbA = {info: [
      {name: 'Plan', values: ['Hobby-dev']}, {name: 'Empty', values: []}, {name: 'Following', resolve_db_name: true, values: ['postgres://ec2-54-111-111-1.compute-1.amazonaws.com:5452/dxxxxxxxxxxxx']},
    ], resource_url: config.DATABASE_URL}
    const dbB = {info: [
      {name: 'Plan', values: ['Hobby-dev']}, {name: 'Following', resolve_db_name: true, values: ['postgres://ec2-55-111-111-1.compute-1.amazonaws.com/dxxxxxxxxxxxx']},
    ], resource_url: config.HEROKU_POSTGRESQL_PURPLE_URL}
    it('shows postgres info', async () => {
      const Cmd = getCmd({allResult: addons, addonResult: {}})
      api.get('/apps/myapp/config-vars')
        .reply(200, config)
      pg.get('/client/v11/databases/1')
        .reply(200, dbA)
        .get('/client/v11/databases/2')
        .reply(200, dbB)
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(stdout.output).to.equal('=== HEROKU_POSTGRESQL_COBALT_URL, DATABASE_URL\n\nPlan:        Hobby-dev\nFollowing:   HEROKU_POSTGRESQL_COBALT\nBilling App: myapp2\nAdd-on:      postgres-1\n\n=== HEROKU_POSTGRESQL_PURPLE_URL\n\nPlan:      Hobby-dev\nFollowing: ec2-55-111-111-1.compute-1.amazonaws.com:5432/dxxxxxxxxxxxx\nAdd-on:    postgres-2\n\n')
      expect(stderr.output).to.equal('')
    })
    it('shows postgres info using attachment names', async () => {
      all = [
        {
          id: 1,
          name: 'postgres-1',
          plan,
          app: {name: 'myapp2'},
          attachment_names: ['DATABASE', 'ATTACHMENT_NAME'],
        }, {id: 2, name: 'postgres-2', plan, app: {name: 'myapp'}, attachment_names: ['HEROKU_POSTGRESQL_PURPLE']},
      ]
      api.get('/apps/myapp/config-vars')
        .reply(200, config)
      pg.get('/client/v11/databases/1')
        .reply(200, dbA)
        .get('/client/v11/databases/2')
        .reply(200, dbB)

      const Cmd = getCmd({allResult: all, addonResult: {}})
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(stdout.output).to.equal('=== DATABASE_URL, ATTACHMENT_NAME_URL\n\nPlan:        Hobby-dev\nFollowing:   HEROKU_POSTGRESQL_COBALT\nBilling App: myapp2\nAdd-on:      postgres-1\n\n=== HEROKU_POSTGRESQL_PURPLE_URL\n\nPlan:      Hobby-dev\nFollowing: ec2-55-111-111-1.compute-1.amazonaws.com:5432/dxxxxxxxxxxxx\nAdd-on:    postgres-2\n\n')
    })
    it('shows postgres info for single database when arg sent in', async () => {
      addon = addons[1]
      api.get('/apps/myapp/config-vars')
        .reply(200, config)
      pg.get('/client/v11/databases/2')
        .reply(200, dbB)

      const Cmd = getCmd({addonResult: addon, allResult: []})
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'postgres-2',
      ])
      expect(stdout.output).to.equal('=== HEROKU_POSTGRESQL_PURPLE_URL\n\nPlan:      Hobby-dev\nFollowing: ec2-55-111-111-1.compute-1.amazonaws.com:5432/dxxxxxxxxxxxx\nAdd-on:    postgres-2\n\n')
      expect(stderr.output).to.equal('')
    })
    it('shows warning for 404', async () => {
      all = addons
      api.get('/apps/myapp/config-vars')
        .reply(200, config)
      pg.get('/client/v11/databases/1')
        .reply(404)
        .get('/client/v11/databases/2')
        .reply(200, dbB)

      const Cmd = getCmd({allResult: addons, addonResult: {}})
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
      expect(stdout.output).to.equal('=== HEROKU_POSTGRESQL_PURPLE_URL\n\nPlan:      Hobby-dev\nFollowing: ec2-55-111-111-1.compute-1.amazonaws.com:5432/dxxxxxxxxxxxx\nAdd-on:    postgres-2\n\n')
      expect(stderr.output).to.include('postgres-1 is not yet provisioned.')
      expect(stderr.output).to.include('Run heroku addons:wait to wait until the db is provisioned.')
    })
  })
})
