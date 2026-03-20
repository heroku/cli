import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import Cmd from '../../../../src/commands/pg/copy.js'
import runCommand from '../../../helpers/runCommand.js'

const addon = {
  app: {name: 'myapp'}, config_vars: ['READONLY_URL', 'DATABASE_URL', 'HEROKU_POSTGRESQL_RED_URL'], id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'},
}
const otherAddon = {
  app: {name: 'myotherapp'}, config_vars: ['DATABASE_URL', 'HEROKU_POSTGRESQL_BLUE_URL'], id: 2, name: 'postgres-2', plan: {name: 'heroku-postgresql:standard-0'},
}
const lowercaseAddon = {
  app: {name: 'mylowercaseapp'}, config_vars: ['LOWERCASE_DATABASE_URL'], id: 2, name: 'postgres-3', plan: {name: 'heroku-postgresql:standard-0'},
}
const attachment = {
  addon, app: {name: 'myapp'}, name: 'HEROKU_POSTGRESQL_RED',
}
const otherAttachment = {
  addon: otherAddon, app: {name: 'myotherapp'}, name: 'HEROKU_POSTGRESQL_BLUE',
}
const lowercaseAttachment = {
  addon: lowercaseAddon, app: {name: 'mylowercaseapp'}, name: 'lowercase_database',
}
const attachedBlueAttachment = {
  addon: otherAddon, app: {name: 'myapp'}, name: 'ATTACHED_BLUE',
}
const myappConfig = {
  ATTACHED_BLUE_URL: 'postgres://heroku/otherdb', DATABASE_URL: 'postgres://heroku/db', HEROKU_POSTGRESQL_RED_URL: 'postgres://heroku/db', READONLY_URL: 'postgres://readonly-heroku/db',
}
const myotherappConfig = {
  DATABASE_URL: 'postgres://heroku/otherdb', HEROKU_POSTGRESQL_BLUE_URL: 'postgres://heroku/otherdb',
}
const mylowercaseappConfig = {
  LOWERCASE_DATABASE_URL: 'postgres://heroku/lowercasedb',
}
const copyingText = () => 'Copying... done\n'

const copyingFailText = () => 'Copying... !\n'

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
        addon_attachment: 'HEROKU_POSTGRESQL_RED_URL', app: 'myapp',
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
      expect(stderr.output).to.include('Starting copy of database bar on foo.com:5432 to RED... done\n')
      expect(stderr.output).to.include(copyingText())
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
      expect(stderr.output).to.include('Starting copy of database bar on boop.com:5678 to RED... done\n')
      expect(stderr.output).to.include(copyingText())
    })
  })
  context('heroku to heroku with additional credentials', function () {
    beforeEach(function () {
      api.get('/addons/postgres-1')
        .reply(200, addon)
      api.get('/addons/postgres-2')
        .reply(200, otherAddon)
      api.post('/actions/addon-attachments/resolve', {
        addon_attachment: 'HEROKU_POSTGRESQL_RED_URL', app: 'myapp',
      })
        .reply(200, [attachment])
      api.post('/actions/addon-attachments/resolve', {
        addon_attachment: 'DATABASE_URL', app: 'myotherapp',
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
      expect(stderr.output).to.include('Starting copy of RED to BLUE... done\n')
      // Check for warning content without exact formatting (text may wrap differently in CI)
      // Strip ANSI codes, remove line continuation markers (› on Unix, » on Windows), and normalize whitespace
      const normalizedOutput = ansis.strip(stderr.output).replace(/[›»]/g, '').replace(/\s+/g, ' ')
      expect(normalizedOutput).to.include('Warning: pg:copy will only copy your default credential and the data it has access to.')
      expect(normalizedOutput).to.include('Any additional credentials and data that only they can access will not be copied.')
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
        addon_attachment: 'HEROKU_POSTGRESQL_RED_URL', app: 'myapp',
      })
        .reply(200, [attachment])
      api.post('/actions/addon-attachments/resolve', {
        addon_attachment: 'ATTACHED_BLUE', app: 'myapp',
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
      expect(stderr.output).to.include('Starting copy of RED to ATTACHED_BLUE... done\n')
      expect(stderr.output).to.include(copyingText())
    })
  })
  context('heroku to heroku with lower case attachment name', function () {
    beforeEach(function () {
      api.get('/addons/postgres-3')
        .reply(200, lowercaseAddon)
      api.get('/addons/postgres-2')
        .reply(200, otherAddon)
      api.post('/actions/addon-attachments/resolve', {
        addon_attachment: 'lowercase_database_URL', app: 'mylowercaseapp',
      })
        .reply(200, [lowercaseAttachment])
      api.post('/actions/addon-attachments/resolve', {
        addon_attachment: 'DATABASE_URL', app: 'myotherapp',
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
      expect(stderr.output).to.include('Starting copy of lowercase_database to BLUE... done\n')
      expect(stderr.output).to.include(copyingText())
    })
  })
  context('fails', function () {
    beforeEach(function () {
      api.get('/addons/postgres-1')
        .reply(200, addon)
      api.post('/actions/addon-attachments/resolve', {
        addon_attachment: 'HEROKU_POSTGRESQL_RED_URL', app: 'myapp',
      })
        .reply(200, [attachment])
      api.get('/apps/myapp/config-vars')
        .reply(200, myappConfig)
      pg.post('/client/v11/databases/1/transfers', {
        from_name: 'database bar on foo.com:5432', from_url: 'postgres://foo.com/bar', to_name: 'RED', to_url: 'postgres://heroku/db',
      })
        .reply(200, {uuid: '100-001'})
      pg.get('/client/v11/apps/myapp/transfers/100-001')
        .reply(200, {finished_at: '100', num: 1, succeeded: false})
      pg.get('/client/v11/apps/myapp/transfers/100-001?verbose=true')
        .reply(200, {
          finished_at: '100', logs: [{message: 'foobar'}], num: 1, succeeded: false,
        })
    })
    it('fails to copy', async function () {
      const err = 'An error occurred and the backup did not finish.\n\nfoobar\n\nRun heroku pg:backups:info b001 for more details.'
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'postgres://foo.com/bar',
        'HEROKU_POSTGRESQL_RED_URL',
      ]).catch(error => expect(ansis.strip(error.message)).to.contain(err))
      expect(stdout.output).to.equal('')
      expect(stderr.output).to.include('Starting copy of database bar on foo.com:5432 to RED... done\n')
      expect(stderr.output).to.include(copyingFailText())
    })
  })
})
