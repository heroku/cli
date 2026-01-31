import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/pg/backups/restore.js'
import runCommand from '../../../../helpers/runCommand.js'

const heredoc = tsheredoc.default
const addon = {
  app: {name: 'myapp'},
  id: 1,
  name: 'postgres-1',
  plan: {name: 'heroku-postgresql:standard-0'},
}
describe('pg:backups:restore', function () {
  let pg: nock.Scope
  let api: nock.Scope

  beforeEach(async function () {
    api = nock('https://api.heroku.com')
    api.post('/actions/addon-attachments/resolve', {
      addon_attachment: 'DATABASE_URL', addon_service: 'heroku-postgresql', app: 'myapp',
    }).reply(200, [{addon}])
    pg = nock('https://api.data.heroku.com')
  })

  afterEach(async function () {
    nock.cleanAll()
    pg.done()
    api.done()
  })

  context('b005', function () {
    beforeEach(async function () {
      pg.get('/client/v11/apps/myapp/transfers')
        .reply(200, [
          {
            from_type: 'pg_dump', num: 5, succeeded: true, to_type: 'gof3r', to_url: 'https://myurl',
          },
        ])
      pg.post('/client/v11/databases/1/restores', {backup_url: 'https://myurl'})
        .reply(200, {
          from_name: 'DATABASE', num: 5, uuid: '100-001',
        })
      pg.get('/client/v11/apps/myapp/transfers/100-001')
        .reply(200, {
          finished_at: '101', succeeded: true,
        })
    })

    it('restores a db', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
      ])
      expect(stdout.output).to.equal(heredoc(`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
      Use heroku pg:backups to check progress.
      Stop a running restore with heroku pg:backups:cancel.

      `))
      expect(stderr.output).to.equal(heredoc(`
      Starting restore of b005 to ⛁ postgres-1... done
      Restoring... done
      `))
    })

    it('restores a specific db', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'b005',
      ])
      expect(stdout.output).to.equal(heredoc(`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
      Use heroku pg:backups to check progress.
      Stop a running restore with heroku pg:backups:cancel.

      `))
      expect(stderr.output).to.equal(heredoc(`
      Starting restore of b005 to ⛁ postgres-1... done
      Restoring... done
      `))
    })

    it('restores a specific app db', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'myapp::b005',
      ])
      expect(stdout.output).to.equal(heredoc(`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
      Use heroku pg:backups to check progress.
      Stop a running restore with heroku pg:backups:cancel.

      `))
      expect(stderr.output).to.equal(heredoc(`
      Starting restore of b005 to ⛁ postgres-1... done
      Restoring... done
      `))
    })
  })

  context('b005 (verbose)', function () {
    beforeEach(async function () {
      pg.get('/client/v11/apps/myapp/transfers')
        .reply(200, [
          {
            from_type: 'pg_dump', num: 5, succeeded: true, to_type: 'gof3r', to_url: 'https://myurl',
          },
        ])
      pg.post('/client/v11/databases/1/restores', {backup_url: 'https://myurl'})
        .reply(200, {
          from_name: 'DATABASE', num: 5, uuid: '100-001',
        })
      pg.get('/client/v11/apps/myapp/transfers/100-001?verbose=true')
        .reply(200, {
          finished_at: '101', logs: [{created_at: '100', message: 'log message 1'}], succeeded: true,
        })
    })

    it('shows verbose output', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        '--verbose',
      ])
      expect(stdout.output).to.equal(heredoc(`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
      Use heroku pg:backups to check progress.
      Stop a running restore with heroku pg:backups:cancel.

      Restoring...
      100 log message 1
      `))

      expect(stderr.output).to.equal(heredoc(`
      Starting restore of b005 to ⛁ postgres-1... done
      Restoring... done
      `))
    })
  })

  context('with a URL', function () {
    beforeEach(async function () {
      pg.post('/client/v11/databases/1/restores', {backup_url: 'https://www.dropbox.com?dl=1'})
        .reply(200, {
          from_name: 'DATABASE', num: 5, uuid: '100-001',
        })
      pg.get('/client/v11/apps/myapp/transfers/100-001')
        .reply(200, {
          finished_at: '101', succeeded: true,
        })
    })

    it('restores a db from a URL', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        'https://www.dropbox.com',
      ])
      expect(stdout.output).to.equal(heredoc(`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
      Use heroku pg:backups to check progress.
      Stop a running restore with heroku pg:backups:cancel.

      `))

      expect(stderr.output).to.equal(heredoc(`
      Starting restore of https://www.dropbox.com to ⛁ postgres-1... done
      Restoring... done
      `))
    })
  })

  context('with extensions', function () {
    beforeEach(async function () {
      pg.get('/client/v11/apps/myapp/transfers')
        .reply(200, [
          {
            from_type: 'pg_dump', num: 5, succeeded: true, to_type: 'gof3r', to_url: 'https://myurl',
          },
        ])
      pg.post('/client/v11/databases/1/restores', {backup_url: 'https://myurl', extensions: ['postgis', 'uuid-ossp']})
        .reply(200, {
          from_name: 'DATABASE', num: 5, uuid: '100-001',
        })
      pg.get('/client/v11/apps/myapp/transfers/100-001')
        .reply(200, {
          finished_at: '101', succeeded: true,
        })
    })

    it('restores a db with pre-installed extensions', async function () {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--confirm',
        'myapp',
        '--extensions',
        'uuid-ossp, Postgis',
      ])
      expect(stdout.output).to.equal(heredoc(`

      Use Ctrl-C at any time to stop monitoring progress; the backup will continue restoring.
      Use heroku pg:backups to check progress.
      Stop a running restore with heroku pg:backups:cancel.

      `))

      expect(stderr.output).to.equal(heredoc(`
      Starting restore of b005 to ⛁ postgres-1... done
      Restoring... done
      `))
    })
  })
})
