import {stdout, stderr} from 'stdout-stderr'
import * as nock from 'nock'
import {expect} from 'chai'
import Cmd  from '../../../../src/commands/pg/copy'
import runCommand from '../../../helpers/runCommand'
// const unwrap = require('../../unwrap')

const addon = {
  id: 1, name: 'postgres-1', app: {name: 'myapp'}, config_vars: ['READONLY_URL', 'DATABASE_URL', 'HEROKU_POSTGRESQL_RED_URL'], plan: {name: 'heroku-postgresql:standard-0'},
}
const otherAddon = {
  id: 2, name: 'postgres-2', app: {name: 'myotherapp'}, config_vars: ['DATABASE_URL', 'HEROKU_POSTGRESQL_BLUE_URL'], plan: {name: 'heroku-postgresql:standard-0'},
}
const lowercaseAddon = {
  id: 2, name: 'postgres-3', app: {name: 'mylowercaseapp'}, config_vars: ['LOWERCASE_DATABASE_URL'], plan: {name: 'heroku-postgresql:standard-0'},
}
const attachment = {
  name: 'HEROKU_POSTGRESQL_RED', app: {name: 'myapp'}, addon,
}
const otherAttachment = {
  name: 'HEROKU_POSTGRESQL_BLUE', app: {name: 'myotherapp'}, addon: otherAddon,
}
const lowercaseAttachment = {
  name: 'lowercase_database', app: {name: 'mylowercaseapp'}, addon: lowercaseAddon,
}
const attachedBlueAttachment = {
  name: 'ATTACHED_BLUE', app: {name: 'myapp'}, addon: otherAddon,
}
const myappConfig = {
  READONLY_URL: 'postgres://readonly-heroku/db', DATABASE_URL: 'postgres://heroku/db', HEROKU_POSTGRESQL_RED_URL: 'postgres://heroku/db', ATTACHED_BLUE_URL: 'postgres://heroku/otherdb',
}
const myotherappConfig = {
  DATABASE_URL: 'postgres://heroku/otherdb', HEROKU_POSTGRESQL_BLUE_URL: 'postgres://heroku/otherdb',
}
const mylowercaseappConfig = {
  LOWERCASE_DATABASE_URL: 'postgres://heroku/lowercasedb',
}
const copyingText = () => {
  return process.stderr.isTTY ? 'Copying... pending\nCopying... done\n' : 'Copying...\nCopying... done\n'
}

const copyingFailText = () => {
  return process.stderr.isTTY ? 'Copying... pending\nCopying... !\n' : 'Copying...\nCopying... !\n'
}

describe('pg:copy', function () {
  let pg: nock.Scope
  let api: nock.Scope

  beforeEach(function () {
    pg = nock('https://api.data.heroku.com')
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    nock.cleanAll()
    api.done()
    pg.done()
  })
  context('url to heroku', function () {
    beforeEach(function () {
      api.get('/addons/postgres-1')
        .reply(200, addon)
      api.post('/actions/addon-attachments/resolve', {
        app: 'myapp', addon_attachment: 'HEROKU_POSTGRESQL_RED_URL', addon_service: 'heroku-postgresql',
      })
        .reply(200, [attachment])
      api.get('/apps/myapp/config-vars')
        .reply(200, myappConfig)
      pg.post('/client/v11/databases/1/transfers', {
        from_name: 'database bar on foo.com:5432', from_url: 'postgres://foo.com/bar', to_name: 'RED', to_url: 'postgres://heroku/db',
      })
        .reply(200, {uuid: '100-001'})
      pg.post('/client/v11/databases/1/transfers', {
        from_name: 'database bar on boop.com:5678', from_url: 'postgres://boop.com:5678/bar', to_name: 'RED', to_url: 'postgres://heroku/db',
      })
        .reply(200, {uuid: '100-001'})
      pg.get('/client/v11/apps/myapp/transfers/100-001')
        .reply(200, {finished_at: '100', succeeded: true})
    })
    it('copies', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'postgres://foo.com/bar',
        'HEROKU_POSTGRESQL_RED_URL',
      ])
      expect(stdout.output).to.equal('')
      expect(stderr.output).to.equal(`Starting copy of database bar on foo.com:5432 to RED...\nStarting copy of database bar on foo.com:5432 to RED... done\n${copyingText()}`)
    })
    it('copies (with port number)', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'postgres://boop.com:5678/bar',
        'HEROKU_POSTGRESQL_RED_URL',
      ])
      expect(stdout.output).to.equal('')
      expect(stderr.output).to.equal(`Starting copy of database bar on boop.com:5678 to RED...\nStarting copy of database bar on boop.com:5678 to RED... done\n${copyingText()}`)
    })
  })
  context('heroku to heroku with additional credentials', function () {
    beforeEach(function () {
      api.get('/addons/postgres-1')
        .reply(200, addon)
      api.get('/addons/postgres-2')
        .reply(200, otherAddon)
      api.post('/actions/addon-attachments/resolve', {
        app: 'myapp', addon_attachment: 'HEROKU_POSTGRESQL_RED_URL', addon_service: 'heroku-postgresql',
      })
        .reply(200, [attachment])
      api.post('/actions/addon-attachments/resolve', {
        app: 'myapp', addon_attachment: 'myotherapp::DATABASE_URL', addon_service: 'heroku-postgresql',
      })
        .reply(200, [otherAttachment])
      api.get('/apps/myapp/config-vars')
        .reply(200, myappConfig)
      api.get('/apps/myotherapp/config-vars')
        .reply(200, myotherappConfig)
      pg.get('/postgres/v0/databases/postgres-1/credentials')
        .reply(200, ['two', 'things'])
      pg.post('/client/v11/databases/2/transfers', {
        from_name: 'RED', from_url: 'postgres://heroku/db', to_name: 'BLUE', to_url: 'postgres://heroku/otherdb',
      })
        .reply(200, {uuid: '100-001'})
      pg.get('/client/v11/apps/myotherapp/transfers/100-001')
        .reply(200, {finished_at: '100', succeeded: true})
    })
    it('copies', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'HEROKU_POSTGRESQL_RED_URL',
        'myotherapp::DATABASE_URL',
      ])
      expect(stdout.output).to.equal('')
      expect(stderr.output).to.include('Starting copy of RED to BLUE...\nStarting copy of RED to BLUE... done\n')
      expect(stderr.output).to.include('Warning: pg:copy will only copy your default credential and the data it \n')
      expect(stderr.output).to.include('has access to. Any additional credentials and data that only they can \n')
      expect(stderr.output).to.include('access will not be copied.\n')
      expect(stderr.output).to.include(copyingText())
    })
  })
  context('heroku to heroku with non-billing app attachment name', function () {
    beforeEach(function () {
      api.get('/addons/postgres-1')
        .reply(200, addon)
      api.get('/addons/postgres-2')
        .reply(200, otherAddon)
      api.post('/actions/addon-attachments/resolve', {
        app: 'myapp', addon_attachment: 'HEROKU_POSTGRESQL_RED_URL', addon_service: 'heroku-postgresql',
      })
        .reply(200, [attachment])
      api.post('/actions/addon-attachments/resolve', {
        app: 'myapp', addon_attachment: 'ATTACHED_BLUE', addon_service: 'heroku-postgresql',
      })
        .reply(200, [attachedBlueAttachment])
      api.get('/apps/myapp/config-vars')
        .twice()
        .reply(200, myappConfig)
      pg.get('/postgres/v0/databases/postgres-1/credentials')
        .reply(200, ['one'])
      pg.post('/client/v11/databases/2/transfers', {
        from_name: 'RED', from_url: 'postgres://heroku/db', to_name: 'ATTACHED_BLUE', to_url: 'postgres://heroku/otherdb',
      })
        .reply(200, {uuid: '100-001'})
      pg.get('/client/v11/apps/myotherapp/transfers/100-001')
        .reply(200, {finished_at: '100', succeeded: true})
    })
    it('copies', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'HEROKU_POSTGRESQL_RED_URL',
        'ATTACHED_BLUE',
      ])
      expect(stdout.output).to.equal('')
      expect(stderr.output).to.equal(`Starting copy of RED to ATTACHED_BLUE...\nStarting copy of RED to ATTACHED_BLUE... done\n${copyingText()}`)
    })
  })
  context('heroku to heroku with lower case attachment name', function () {
    beforeEach(function () {
      api.get('/addons/postgres-3')
        .reply(200, lowercaseAddon)
      api.get('/addons/postgres-2')
        .reply(200, otherAddon)
      api.post('/actions/addon-attachments/resolve', {
        app: 'mylowercaseapp', addon_attachment: 'lowercase_database_URL', addon_service: 'heroku-postgresql',
      })
        .reply(200, [lowercaseAttachment])
      api.post('/actions/addon-attachments/resolve', {
        app: 'mylowercaseapp', addon_attachment: 'myotherapp::DATABASE_URL', addon_service: 'heroku-postgresql',
      })
        .reply(200, [otherAttachment])
      api.get('/apps/mylowercaseapp/config-vars')
        .reply(200, mylowercaseappConfig)
      api.get('/apps/myotherapp/config-vars')
        .reply(200, myotherappConfig)
      pg.get('/postgres/v0/databases/postgres-3/credentials')
        .reply(200, ['one'])
      pg.post('/client/v11/databases/2/transfers', {
        from_name: 'lowercase_database', from_url: 'postgres://heroku/lowercasedb', to_name: 'BLUE', to_url: 'postgres://heroku/otherdb',
      })
        .reply(200, {uuid: '100-001'})
      pg.get('/client/v11/apps/myotherapp/transfers/100-001')
        .reply(200, {finished_at: '100', succeeded: true})
    })
    it('copies', async function () {
      await runCommand(Cmd, [
        '--app',
        'mylowercaseapp',
        '--confirm',
        'mylowercaseapp',
        'lowercase_database_URL',
        'myotherapp::DATABASE_URL',
      ])
      expect(stdout.output).to.equal('')
      expect(stderr.output).to.equal(`Starting copy of lowercase_database to BLUE...\nStarting copy of lowercase_database to BLUE... done\n${copyingText()}`)
    })
  })
  context('fails', function () {
    beforeEach(function () {
      api.get('/addons/postgres-1')
        .reply(200, addon)
      api.post('/actions/addon-attachments/resolve', {
        app: 'myapp', addon_attachment: 'HEROKU_POSTGRESQL_RED_URL', addon_service: 'heroku-postgresql',
      })
        .reply(200, [attachment])
      api.get('/apps/myapp/config-vars')
        .reply(200, myappConfig)
      pg.post('/client/v11/databases/1/transfers', {
        from_name: 'database bar on foo.com:5432', from_url: 'postgres://foo.com/bar', to_name: 'RED', to_url: 'postgres://heroku/db',
      })
        .reply(200, {uuid: '100-001'})
      pg.get('/client/v11/apps/myapp/transfers/100-001')
        .reply(200, {finished_at: '100', succeeded: false, num: 1})
      pg.get('/client/v11/apps/myapp/transfers/100-001?verbose=true')
        .reply(200, {finished_at: '100', succeeded: false, num: 1, logs: [{message: 'foobar'}]})
    })
    it('fails to copy', async function () {
      const err = 'An error occurred and the backup did not finish.\n\nfoobar\n\nRun \u001B[36m\u001B[1mheroku pg:backups:info b001\u001B[22m\u001B[39m for more details.'
      await expect(runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'postgres://foo.com/bar',
        'HEROKU_POSTGRESQL_RED_URL',
      ])).to.be.rejectedWith(Error, err)
      expect(stdout.output).to.equal('')
      expect(stderr.output).to.equal(`Starting copy of database bar on foo.com:5432 to RED...\nStarting copy of database bar on foo.com:5432 to RED... done\n${copyingFailText()}`)
    })
  })
})
