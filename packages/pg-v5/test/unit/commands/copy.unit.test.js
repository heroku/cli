'use strict'
/* global beforeEach afterEach context */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const unwrap = require('../../unwrap')

const cmd = require('../../..').commands.find(c => c.topic === 'pg' && c.command === 'copy')

const addon = {
  id: 1,
  name: 'postgres-1',
  app: {name: 'myapp'},
  config_vars: ['READONLY_URL', 'DATABASE_URL', 'HEROKU_POSTGRESQL_RED_URL'],
  plan: {name: 'heroku-postgresql:standard-0'},
}
const otherAddon = {
  id: 2,
  name: 'postgres-2',
  app: {name: 'myotherapp'},
  config_vars: ['DATABASE_URL', 'HEROKU_POSTGRESQL_BLUE_URL'],
  plan: {name: 'heroku-postgresql:standard-0'},
}
const lowercaseAddon = {
  id: 2,
  name: 'postgres-3',
  app: {name: 'mylowercaseapp'},
  config_vars: ['LOWERCASE_DATABASE_URL'],
  plan: {name: 'heroku-postgresql:standard-0'},
}
const attachment = {
  name: 'HEROKU_POSTGRESQL_RED',
  app: {name: 'myapp'},
  addon,
}
const otherAttachment = {
  name: 'HEROKU_POSTGRESQL_BLUE',
  app: {name: 'myotherapp'},
  addon: otherAddon,
}
const lowercaseAttachment = {
  name: 'lowercase_database',
  app: {name: 'mylowercaseapp'},
  addon: lowercaseAddon,
}
const attachedBlueAttachment = {
  name: 'ATTACHED_BLUE',
  app: {name: 'myapp'},
  addon: otherAddon,
}
const myappConfig = {
  READONLY_URL: 'postgres://readonly-heroku/db',
  DATABASE_URL: 'postgres://heroku/db',
  HEROKU_POSTGRESQL_RED_URL: 'postgres://heroku/db',
  ATTACHED_BLUE_URL: 'postgres://heroku/otherdb',
}
const myotherappConfig = {
  DATABASE_URL: 'postgres://heroku/otherdb',
  HEROKU_POSTGRESQL_BLUE_URL: 'postgres://heroku/otherdb',
}
const mylowercaseappConfig = {
  LOWERCASE_DATABASE_URL: 'postgres://heroku/lowercasedb',
}

let copyingText = () => {
  return process.stderr.isTTY ? 'Copying... pending\nCopying... done\n' : 'Copying... done\n'
}

let copyingFailText = () => {
  return process.stderr.isTTY ? 'Copying... pending\nCopying... !\n' : 'Copying... !\n'
}

let credentialWarningText = () => {
  return `pg:copy will only copy your default credential and the data it has access to. Any additional credentials \
and data that only they can access will not be copied.
`
}

describe('pg:copy', () => {
  let pg
  let api

  beforeEach(() => {
    pg = nock('https://postgres-api.heroku.com')
    api = nock('https://api.heroku.com')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  context('url to heroku', () => {
    beforeEach(() => {
      api.get('/addons/postgres-1').reply(200, addon)
      api.post('/actions/addon-attachments/resolve', {
        app: 'myapp',
        addon_attachment: 'HEROKU_POSTGRESQL_RED_URL',
        addon_service: 'heroku-postgresql',
      }).reply(200, [attachment])
      api.get('/apps/myapp/config-vars').reply(200, myappConfig)
      pg.post('/client/v11/databases/1/transfers', {
        from_name: 'database bar on foo.com:5432',
        from_url: 'postgres://foo.com/bar',
        to_name: 'RED',
        to_url: 'postgres://heroku/db',
      }).reply(200, {uuid: '100-001'})
      pg.post('/client/v11/databases/1/transfers', {
        from_name: 'database bar on boop.com:5678',
        from_url: 'postgres://boop.com:5678/bar',
        to_name: 'RED',
        to_url: 'postgres://heroku/db',
      }).reply(200, {uuid: '100-001'})
      pg.get('/client/v11/apps/myapp/transfers/100-001').reply(200, {finished_at: '100', succeeded: true})
    })

    it('copies', () => {
      return cmd.run({app: 'myapp', args: {source: 'postgres://foo.com/bar', target: 'HEROKU_POSTGRESQL_RED_URL'}, flags: {confirm: 'myapp'}})
        .then(() => expect(cli.stdout).to.equal(''))
        .then(() => expect(cli.stderr).to.equal(`Starting copy of database bar on foo.com:5432 to RED... done\n${copyingText()}`))
    })

    it('copies (with port number)', () => {
      return cmd.run({app: 'myapp', args: {source: 'postgres://boop.com:5678/bar', target: 'HEROKU_POSTGRESQL_RED_URL'}, flags: {confirm: 'myapp'}})
        .then(() => expect(cli.stdout).to.equal(''))
        .then(() => expect(cli.stderr).to.equal(`Starting copy of database bar on boop.com:5678 to RED... done\n${copyingText()}`))
    })
  })

  context('heroku to heroku with additional credentials', () => {
    beforeEach(() => {
      api.get('/addons/postgres-1').reply(200, addon)
      api.get('/addons/postgres-2').reply(200, otherAddon)
      api.post('/actions/addon-attachments/resolve', {
        app: 'myapp',
        addon_attachment: 'HEROKU_POSTGRESQL_RED_URL',
        addon_service: 'heroku-postgresql',
      }).reply(200, [attachment])
      api.post('/actions/addon-attachments/resolve', {
        app: 'myapp',
        addon_attachment: 'myotherapp::DATABASE_URL',
        addon_service: 'heroku-postgresql',
      }).reply(200, [otherAttachment])
      api.get('/apps/myapp/config-vars').reply(200, myappConfig)
      api.get('/apps/myotherapp/config-vars').reply(200, myotherappConfig)
      pg.get('/postgres/v0/databases/postgres-1/credentials').reply(200, ['two', 'things'])
      pg.post('/client/v11/databases/2/transfers', {
        from_name: 'RED',
        from_url: 'postgres://heroku/db',
        to_name: 'BLUE',
        to_url: 'postgres://heroku/otherdb',
      }).reply(200, {uuid: '100-001'})
      pg.get('/client/v11/apps/myotherapp/transfers/100-001').reply(200, {finished_at: '100', succeeded: true})
    })
    it('copies', () => {
      return cmd.run({app: 'myapp', args: {source: 'HEROKU_POSTGRESQL_RED_URL', target: 'myotherapp::DATABASE_URL'}, flags: {confirm: 'myapp'}})
        .then(() => expect(cli.stdout).to.equal(''))
        .then(() => expect(unwrap(cli.stderr)).to.equal(`Starting copy of RED to BLUE... done ${credentialWarningText()}${copyingText()}`))
    })
  })

  context('heroku to heroku with non-billing app attachment name', () => {
    beforeEach(() => {
      api.get('/addons/postgres-1').reply(200, addon)
      api.get('/addons/postgres-2').reply(200, otherAddon)
      api.post('/actions/addon-attachments/resolve', {
        app: 'myapp',
        addon_attachment: 'HEROKU_POSTGRESQL_RED_URL',
        addon_service: 'heroku-postgresql',
      }).reply(200, [attachment])
      api.post('/actions/addon-attachments/resolve', {
        app: 'myapp',
        addon_attachment: 'ATTACHED_BLUE',
        addon_service: 'heroku-postgresql',
      }).reply(200, [attachedBlueAttachment])
      api.get('/apps/myapp/config-vars').twice().reply(200, myappConfig)
      pg.get('/postgres/v0/databases/postgres-1/credentials').reply(200, ['one'])
      pg.post('/client/v11/databases/2/transfers', {
        from_name: 'RED',
        from_url: 'postgres://heroku/db',
        to_name: 'ATTACHED_BLUE',
        to_url: 'postgres://heroku/otherdb',
      }).reply(200, {uuid: '100-001'})
      pg.get('/client/v11/apps/myotherapp/transfers/100-001').reply(200, {finished_at: '100', succeeded: true})
    })
    it('copies', () => {
      return cmd.run({app: 'myapp', args: {source: 'HEROKU_POSTGRESQL_RED_URL', target: 'ATTACHED_BLUE'}, flags: {confirm: 'myapp'}})
        .then(() => expect(cli.stdout).to.equal(''))
        .then(() => expect(cli.stderr).to.equal(`Starting copy of RED to ATTACHED_BLUE... done\n${copyingText()}`))
    })
  })

  context('heroku to heroku with lower case attachment name', () => {
    beforeEach(() => {
      api.get('/addons/postgres-3').reply(200, lowercaseAddon)
      api.get('/addons/postgres-2').reply(200, otherAddon)
      api.post('/actions/addon-attachments/resolve', {
        app: 'mylowercaseapp',
        addon_attachment: 'lowercase_database_URL',
        addon_service: 'heroku-postgresql',
      }).reply(200, [lowercaseAttachment])
      api.post('/actions/addon-attachments/resolve', {
        app: 'mylowercaseapp',
        addon_attachment: 'myotherapp::DATABASE_URL',
        addon_service: 'heroku-postgresql',
      }).reply(200, [otherAttachment])
      api.get('/apps/mylowercaseapp/config-vars').reply(200, mylowercaseappConfig)
      api.get('/apps/myotherapp/config-vars').reply(200, myotherappConfig)
      pg.get('/postgres/v0/databases/postgres-3/credentials').reply(200, ['one'])
      pg.post('/client/v11/databases/2/transfers', {
        from_name: 'lowercase_database',
        from_url: 'postgres://heroku/lowercasedb',
        to_name: 'BLUE',
        to_url: 'postgres://heroku/otherdb',
      }).reply(200, {uuid: '100-001'})
      pg.get('/client/v11/apps/myotherapp/transfers/100-001').reply(200, {finished_at: '100', succeeded: true})
    })
    it('copies', () => {
      return cmd.run({app: 'mylowercaseapp', args: {source: 'lowercase_database_URL', target: 'myotherapp::DATABASE_URL'}, flags: {confirm: 'mylowercaseapp'}})
        .then(() => expect(cli.stdout).to.equal(''))
        .then(() => expect(unwrap(cli.stderr)).to.equal(`Starting copy of lowercase_database to BLUE... done\n${copyingText()}`))
    })
  })

  context('fails', () => {
    beforeEach(() => {
      api.get('/addons/postgres-1').reply(200, addon)
      api.post('/actions/addon-attachments/resolve', {
        app: 'myapp',
        addon_attachment: 'HEROKU_POSTGRESQL_RED_URL',
        addon_service: 'heroku-postgresql',
      }).reply(200, [attachment])
      api.get('/apps/myapp/config-vars').reply(200, myappConfig)
      pg.post('/client/v11/databases/1/transfers', {
        from_name: 'database bar on foo.com:5432',
        from_url: 'postgres://foo.com/bar',
        to_name: 'RED',
        to_url: 'postgres://heroku/db',
      }).reply(200, {uuid: '100-001'})
      pg.get('/client/v11/apps/myapp/transfers/100-001').reply(200, {finished_at: '100', succeeded: false, num: 1})
      pg.get('/client/v11/apps/myapp/transfers/100-001?verbose=true').reply(200, {finished_at: '100', succeeded: false, num: 1, logs: [{message: 'foobar'}]})
    })

    it('fails to copy', () => {
      let err = 'An error occurred and the backup did not finish.\n\nfoobar\n\nRun heroku pg:backups:info b001 for more details.'
      return expect(cmd.run({app: 'myapp', args: {source: 'postgres://foo.com/bar', target: 'HEROKU_POSTGRESQL_RED_URL'}, flags: {confirm: 'myapp'}})).to.be.rejectedWith(Error, err)
        .then(() => expect(cli.stdout).to.equal(''))
        .then(() => expect(cli.stderr).to.equal(`Starting copy of database bar on foo.com:5432 to RED... done\n${copyingFailText()}`))
    })
  })
})
