import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout, stderr} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import Cmd  from '../../../../../src/commands/pg/backups/restore'
import runCommand from '../../../../helpers/runCommand'

const addon = {id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'}, app: {name: 'myapp'}}

describe('pg:backups:restore', function () {
  let pg: nock.Scope
  let api: nock.Scope

  beforeEach(async () => {
    api = nock('https://api.heroku.com')
    api.post('/actions/addon-attachments/resolve', {
      app: 'myapp', addon_attachment: 'DATABASE_URL', addon_service: 'heroku-postgresql',
    }).reply(200, [{addon}])
    pg = nock('https://api.data.heroku.com')
  })

  afterEach(async () => {
    nock.cleanAll()
    pg.done()
    api.done()
  })

  context('b005', () => {
    beforeEach(async () => {
      pg.get('/client/v11/apps/myapp/transfers')
        .reply(200, [
          {num: 5, from_type: 'pg_dump', to_type: 'gof3r', succeeded: true, to_url: 'https://myurl'},
        ])
      pg.post('/client/v11/databases/1/restores', {backup_url: 'https://myurl'})
        .reply(200, {
          num: 5, from_name: 'DATABASE', uuid: '100-001',
        })
      pg.get('/client/v11/apps/myapp/transfers/100-001')
        .reply(200, {
          finished_at: '101', succeeded: true,
        })
    })

    it('restores a db', async () => {
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
      Starting restore of b005 to postgres-1...
      Starting restore of b005 to postgres-1... done
      Restoring...
      Restoring... done
      `))
    })

    it('restores a specific db', async () => {
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
      Starting restore of b005 to postgres-1...
      Starting restore of b005 to postgres-1... done
      Restoring...
      Restoring... done
      `))
    })

    it('restores a specific app db', async () => {
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
      Starting restore of b005 to postgres-1...
      Starting restore of b005 to postgres-1... done
      Restoring...
      Restoring... done
      `))
    })
  })

  context('b005 (verbose)', () => {
    beforeEach(async () => {
      pg.get('/client/v11/apps/myapp/transfers')
        .reply(200, [
          {num: 5, from_type: 'pg_dump', to_type: 'gof3r', succeeded: true, to_url: 'https://myurl'},
        ])
      pg.post('/client/v11/databases/1/restores', {backup_url: 'https://myurl'})
        .reply(200, {
          num: 5, from_name: 'DATABASE', uuid: '100-001',
        })
      pg.get('/client/v11/apps/myapp/transfers/100-001?verbose=true')
        .reply(200, {
          finished_at: '101', succeeded: true, logs: [{created_at: '100', message: 'log message 1'}],
        })
    })

    it('shows verbose output', async () => {
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
      Starting restore of b005 to postgres-1...
      Starting restore of b005 to postgres-1... done
      Restoring...
      Restoring... done
      `))
    })
  })

  context('with a URL', () => {
    beforeEach(async () => {
      pg.post('/client/v11/databases/1/restores', {backup_url: 'https://www.dropbox.com?dl=1'})
        .reply(200, {
          num: 5, from_name: 'DATABASE', uuid: '100-001',
        })
      pg.get('/client/v11/apps/myapp/transfers/100-001')
        .reply(200, {
          finished_at: '101', succeeded: true,
        })
    })

    it('restores a db from a URL', async () => {
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
      Starting restore of https://www.dropbox.com to postgres-1...
      Starting restore of https://www.dropbox.com to postgres-1... done
      Restoring...
      Restoring... done
      `))
    })
  })

  context('with extensions', () => {
    beforeEach(async () => {
      pg.get('/client/v11/apps/myapp/transfers')
        .reply(200, [
          {num: 5, from_type: 'pg_dump', to_type: 'gof3r', succeeded: true, to_url: 'https://myurl'},
        ])
      pg.post('/client/v11/databases/1/restores', {backup_url: 'https://myurl', extensions: ['postgis', 'uuid-ossp']})
        .reply(200, {
          num: 5, from_name: 'DATABASE', uuid: '100-001',
        })
      pg.get('/client/v11/apps/myapp/transfers/100-001')
        .reply(200, {
          finished_at: '101', succeeded: true,
        })
    })

    it('restores a db with pre-installed extensions', async () => {
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
      Starting restore of b005 to postgres-1...
      Starting restore of b005 to postgres-1... done
      Restoring...
      Restoring... done
      `))
    })
  })
})
