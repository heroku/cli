import {stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/pg/promote'
import runCommand from '../../../helpers/runCommand'
import expectOutput from '../../../helpers/utils/expectOutput'
import {expect} from 'chai'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import * as fixtures from '../../../fixtures/addons/fixtures'
const stripAnsi = require('strip-ansi')

describe('pg:promote when argument is database', () => {
  const addon = fixtures.addons['dwh-db']
  const pgbouncerAddonID = 'c667bce0-3238-4202-8550-e1dc323a02a2'

  beforeEach(() => {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.heroku.com')
      .get('/apps/myapp/formation')
      .reply(200, [])
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}/wait_status`)
      .reply(200, {message: 'available', 'waiting?': false})
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200, {following: null})
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('promotes db and attaches pgbouncer if DATABASE_CONNECTION_POOL is an attachment', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments').reply(200, [
        {
          name: 'DATABASE',
          addon: {name: 'postgres-2'},
          namespace: null,
        },
        {
          name: 'DATABASE_CONNECTION_POOL',
          id: pgbouncerAddonID,
          addon: {name: 'postgres-2'},
          namespace: 'connection-pooling:default',
        },
      ])
    nock('https://api.heroku.com')
      .post('/addon-attachments', {
        app: {name: 'myapp'},
        addon: {name: 'postgres-2'},
        namespace: null,
        confirm: 'myapp',
      }).reply(201, {name: 'RED'})
    nock('https://api.heroku.com')
      .post('/addon-attachments', {
        name: 'DATABASE',
        app: {name: 'myapp'},
        addon: {name: addon.name},
        namespace: null,
        confirm: 'myapp',
      }).reply(201)
    nock('https://api.heroku.com').delete(`/addon-attachments/${pgbouncerAddonID}`).reply(200)
    nock('https://api.heroku.com')
      .post('/addon-attachments', {
        name: 'DATABASE_CONNECTION_POOL',
        app: {name: 'myapp'},
        addon: {name: addon.name},
        namespace: 'connection-pooling:default',
        confirm: 'myapp',
      }).reply(201)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr.output, heredoc(`
      Ensuring an alternate alias for existing DATABASE_URL...
      Ensuring an alternate alias for existing DATABASE_URL... RED_URL
      Promoting ${addon.name} to DATABASE_URL on ⬢ myapp...
      Promoting ${addon.name} to DATABASE_URL on ⬢ myapp... done
      Reattaching pooler to new leader...
      Reattaching pooler to new leader... done
    `))
  })

  it('promotes db and does not detach pgbouncers attached to new leader under other name than DATABASE_CONNECTION_POOL', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          name: 'DATABASE',
          addon: {name: 'postgres-2'},
          namespace: null,
        },
        {
          name: 'DATABASE_CONNECTION_POOL2',
          id: '12345',
          addon: {name: addon.name, id: '1'},
          namespace: 'connection-pooling:default',
        },
      ])
      .post('/addon-attachments', {
        app: {name: 'myapp'}, addon: {name: 'postgres-2'}, namespace: null, confirm: 'myapp',
      })
      .reply(201, {name: 'RED'})
      .post('/addon-attachments', {
        name: 'DATABASE', app: {name: 'myapp'}, addon: {name: addon.name}, namespace: null, confirm: 'myapp',
      })
      .reply(201)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr.output, heredoc(`
      Ensuring an alternate alias for existing DATABASE_URL...
      Ensuring an alternate alias for existing DATABASE_URL... RED_URL
      Promoting ${addon.name} to DATABASE_URL on ⬢ myapp...
      Promoting ${addon.name} to DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('promotes db and does not reattach pgbouncer if DATABASE_CONNECTION_POOL attached to database being promoted, but not old leader', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          name: 'DATABASE',
          addon: {name: 'postgres-2'},
          namespace: null,
        },
        {
          name: 'DATABASE_CONNECTION_POOL',
          id: '12345',
          addon: {name: addon.name, id: addon.id},
          namespace: 'connection-pooling:default',
        },
      ])
      .post('/addon-attachments', {
        app: {name: 'myapp'}, addon: {name: 'postgres-2'}, namespace: null, confirm: 'myapp',
      })
      .reply(201, {name: 'RED'})
      .post('/addon-attachments', {
        name: 'DATABASE', app: {name: 'myapp'}, addon: {name: addon.name}, namespace: null, confirm: 'myapp',
      })
      .reply(201)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr.output, heredoc(`
      Ensuring an alternate alias for existing DATABASE_URL...
      Ensuring an alternate alias for existing DATABASE_URL... RED_URL
      Promoting ${addon.name} to DATABASE_URL on ⬢ myapp...
      Promoting ${addon.name} to DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('promotes the db and creates another attachment if current DATABASE does not have another', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {name: 'DATABASE', addon: {name: 'postgres-2'}, namespace: null},
      ])
      .post('/addon-attachments', {
        app: {name: 'myapp'},
        addon: {name: 'postgres-2'},
        namespace: null,
        confirm: 'myapp',
      })
      .reply(201, {name: 'RED'})
      .post('/addon-attachments', {
        name: 'DATABASE',
        app: {name: 'myapp'},
        addon: {name: addon.name},
        namespace: null,
        confirm: 'myapp',
      })
      .reply(201)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr.output, heredoc(`
      Ensuring an alternate alias for existing DATABASE_URL...
      Ensuring an alternate alias for existing DATABASE_URL... RED_URL
      Promoting ${addon.name} to DATABASE_URL on ⬢ myapp...
      Promoting ${addon.name} to DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('promotes the db and does not create another attachment if current DATABASE has another', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          name: 'DATABASE',
          addon: {name: 'postgres-2'},
          namespace: null,
        },
        {
          name: 'RED',
          addon: {name: 'postgres-2'},
          namespace: null,
        },
      ])
      .post('/addon-attachments', {
        name: 'DATABASE',
        app: {name: 'myapp'},
        addon: {name: addon.name},
        namespace: null,
        confirm: 'myapp',
      })
      .reply(201)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr.output, heredoc(`
      Ensuring an alternate alias for existing DATABASE_URL...
      Ensuring an alternate alias for existing DATABASE_URL... RED_URL
      Promoting ${addon.name} to DATABASE_URL on ⬢ myapp...
      Promoting ${addon.name} to DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('does not promote the db if is already is DATABASE', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {name: 'DATABASE', addon: {name: addon.name}, namespace: null},
        {name: 'PURPLE', addon: {name: addon.name}, namespace: null},
      ])
    const err = `${addon.name} is already promoted on ⬢ myapp`
    await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ]).catch((error: Error) => {
      expect(stripAnsi(error.message)).to.equal(err)
    })
  })
})

describe('pg:promote when argument is a credential attachment', () => {
  const addon = fixtures.addons['dwh-db']

  beforeEach(() => {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {
        app: 'myapp',
        addon_attachment: 'DATABASE',
        addon_service: 'heroku-postgresql',
      })
      .reply(200, [{addon, name: 'PURPLE', namespace: 'credential:hello'}])
    nock('https://api.heroku.com')
      .get('/apps/myapp/formation')
      .reply(200, [])
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}/wait_status`)
      .reply(200, {message: 'available', 'waiting?': false})
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200, {following: null})
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('promotes the credential and creates another attachment if current DATABASE does not have another', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          name: 'DATABASE',
          addon: {name: 'postgres-2'},
        },
        {
          name: 'RED',
          addon: {name: addon.name},
          namespace: 'credential:hello',
        },
      ])
      .post('/addon-attachments', {
        app: {name: 'myapp'}, addon: {name: 'postgres-2'}, confirm: 'myapp',
      })
      .reply(201, {name: 'RED'})
      .post('/addon-attachments', {
        name: 'DATABASE',
        app: {name: 'myapp'},
        addon: {name: addon.name},
        namespace: 'credential:hello',
        confirm: 'myapp',
      })
      .reply(201)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr.output, heredoc(`
      Ensuring an alternate alias for existing DATABASE_URL...
      Ensuring an alternate alias for existing DATABASE_URL... RED_URL
      Promoting PURPLE to DATABASE_URL on ⬢ myapp...
      Promoting PURPLE to DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('promotes the credential and creates another attachment if current DATABASE does not have another and current DATABASE is a credential', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          name: 'PURPLE',
          addon: {name: addon.name},
          namespace: 'credential:hello',
        },
        {
          name: 'DATABASE',
          addon: {name: addon.name},
          namespace: 'credential:goodbye',
        },
      ])
      .post('/addon-attachments', {
        app: {name: 'myapp'},
        addon: {name: addon.name},
        namespace: 'credential:goodbye',
        confirm: 'myapp',
      })
      .reply(201, {name: 'RED'})
      .post('/addon-attachments', {
        name: 'DATABASE',
        app: {name: 'myapp'},
        addon: {name: addon.name},
        namespace: 'credential:hello',
        confirm: 'myapp',
      })
      .reply(201)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr.output, heredoc(`
      Ensuring an alternate alias for existing DATABASE_URL...
      Ensuring an alternate alias for existing DATABASE_URL... RED_URL
      Promoting PURPLE to DATABASE_URL on ⬢ myapp...
      Promoting PURPLE to DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('promotes the credential and does not create another attachment if current DATABASE has another', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          name: 'DATABASE',
          addon: {name: 'postgres-2'},
        },
        {
          name: 'RED',
          addon: {name: 'postgres-2'},
        },
        {
          name: 'PURPLE',
          addon: {name: addon.name},
          namespace: 'credential:hello',
        },
      ])
      .post('/addon-attachments', {
        name: 'DATABASE', app: {name: 'myapp'}, addon: {name: addon.name}, namespace: 'credential:hello', confirm: 'myapp',
      })
      .reply(201)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr.output, heredoc(`
      Ensuring an alternate alias for existing DATABASE_URL...
      Ensuring an alternate alias for existing DATABASE_URL... RED_URL
      Promoting PURPLE to DATABASE_URL on ⬢ myapp...
      Promoting PURPLE to DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('promotes the credential if the current promoted database is for the same addon, but the default credential', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          name: 'DATABASE',
          addon: {name: addon.name},
          namespace: null,
        }, {
          name: 'RED', addon: {name: addon.name},
          namespace: null,
        }, {
          name: 'PURPLE',
          addon: {name: addon.name},
          namespace: 'credential:hello',
        },
      ])
      .post('/addon-attachments', {
        name: 'DATABASE',
        app: {name: 'myapp'},
        addon: {name: addon.name},
        namespace: 'credential:hello',
        confirm: 'myapp',
      })
      .reply(201)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr.output, heredoc(`
      Ensuring an alternate alias for existing DATABASE_URL...
      Ensuring an alternate alias for existing DATABASE_URL... RED_URL
      Promoting PURPLE to DATABASE_URL on ⬢ myapp...
      Promoting PURPLE to DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('promotes the credential if the current promoted database is for the same addon, but another credential', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          name: 'DATABASE',
          addon: {name: addon.name},
          namespace: 'credential:goodbye',
        }, {
          name: 'RED',
          addon: {name: addon.name},
          namespace: 'credential:goodbye',
        }, {
          name: 'PURPLE',
          addon: {name: addon.name},
          namespace: 'credential:hello',
        },
      ])
      .post('/addon-attachments', {
        name: 'DATABASE',
        app: {name: 'myapp'},
        addon: {name: addon.name},
        namespace: 'credential:hello',
        confirm: 'myapp',
      })
      .reply(201)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr.output, heredoc(`
      Ensuring an alternate alias for existing DATABASE_URL...
      Ensuring an alternate alias for existing DATABASE_URL... RED_URL
      Promoting PURPLE to DATABASE_URL on ⬢ myapp...
      Promoting PURPLE to DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('does not promote the credential if it already is DATABASE', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          name: 'RED',
          addon: {name: addon.name}, namespace: null,
        }, {
          name: 'DATABASE',
          addon: {name: addon.name},
          namespace: 'credential:hello',
        }, {
          name: 'PURPLE',
          addon: {name: addon.name},
          namespace: 'credential:hello',
        },
      ])
    const err = 'PURPLE is already promoted on ⬢ myapp'
    await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
      .catch((error: Error) => {
        expect(stripAnsi(error.message)).to.equal(err)
      })
  })
})

describe('pg:promote when release phase is present', () => {
  const addon = fixtures.addons['dwh-db']

  beforeEach(() => {
    nock('https://api.heroku.com:')
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'release'}])
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          name: 'DATABASE',
          addon: {name: addon.name},
          namespace: 'credential:goodbye',
        }, {
          name: 'RED',
          addon: {name: addon.name},
          namespace: 'credential:goodbye',
        }, {
          name: 'PURPLE',
          addon: {name: addon.name},
          namespace: 'credential:hello',
        },
      ])
      .post('/addon-attachments', {
        name: 'DATABASE',
        app: {name: 'myapp'},
        addon: {name: addon.name},
        namespace: 'credential:hello',
        confirm: 'myapp',
      })
      .reply(201)
      .post('/addon-attachments', {
        name: 'DATABASE', app: {name: 'myapp'}, addon: {name: addon.name}, namespace: null, confirm: 'myapp',
      })
      .reply(201)
      .post('/actions/addon-attachments/resolve', {
        app: 'myapp', addon_attachment: 'DATABASE', addon_service: 'heroku-postgresql',
      })
      .reply(201, [{
        name: 'PURPLE', addon: {name: addon.name, id: addon.id}, namespace: 'credential:hello',
      }])
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}/wait_status`)
      .reply(200, {message: 'available', 'waiting?': false})
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200, {following: null})
  })
  afterEach(() => {
    nock.cleanAll()
  })

  it('checks release phase', async () => {
    nock('https://api.heroku.com:')
      .get('/apps/myapp/releases')
      .reply(200, [{id: 1, description: 'Attach DATABASE'}, {id: 2, description: 'Detach DATABASE'}])
      .get('/apps/myapp/releases/1')
      .reply(200, {status: 'succeeded'})
      .get('/apps/myapp/releases/2')
      .reply(200, {status: 'succeeded'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr.output, heredoc(`
      Ensuring an alternate alias for existing DATABASE_URL...
      Ensuring an alternate alias for existing DATABASE_URL... RED_URL
      Promoting PURPLE to DATABASE_URL on ⬢ myapp...
      Promoting PURPLE to DATABASE_URL on ⬢ myapp... done
      Checking release phase...
      Checking release phase... pg:promote succeeded.
    `))
  })

  it('checks release phase for detach failure', async () => {
    nock('https://api.heroku.com:')
      .get('/apps/myapp/releases')
      .reply(200, [{id: 1, description: 'Attach DATABASE'}, {id: 2, description: 'Detach DATABASE'}])
      .get('/apps/myapp/releases/1')
      .reply(200, {status: 'succeeded'})
      .get('/apps/myapp/releases/2')
      .reply(200, {status: 'failed', description: 'Detach DATABASE'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr.output, heredoc(`
      Ensuring an alternate alias for existing DATABASE_URL...
      Ensuring an alternate alias for existing DATABASE_URL... RED_URL
      Promoting PURPLE to DATABASE_URL on ⬢ myapp...
      Promoting PURPLE to DATABASE_URL on ⬢ myapp... done
      Checking release phase...
      Checking release phase... pg:promote succeeded. It is safe to ignore the failed Detach DATABASE release.
    `))
  })

  it('checks release phase for attach failure', async () => {
    nock('https://api.heroku.com:')
      .get('/apps/myapp/releases')
      .reply(200, [{id: 1, description: 'Attach DATABASE'}, {id: 2, description: 'Detach DATABASE'}])
      .get('/apps/myapp/releases/1')
      .reply(200, {status: 'failed', description: 'Attach DATABASE'})
      .get('/apps/myapp/releases/2')
      .reply(200, {status: 'failed', description: 'Attach DATABASE'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr.output, heredoc(`
      Ensuring an alternate alias for existing DATABASE_URL...
      Ensuring an alternate alias for existing DATABASE_URL... RED_URL
      Promoting PURPLE to DATABASE_URL on ⬢ myapp...
      Promoting PURPLE to DATABASE_URL on ⬢ myapp... done
      Checking release phase...
      Checking release phase... pg:promote failed because Attach DATABASE release was unsuccessful. Your application is currently running with ${addon.name} attached as DATABASE_URL. Check your release phase logs for failure causes.
    `))
  })

  it('checks release phase for attach failure and detach success', async () => {
    nock('https://api.heroku.com:')
      .get('/apps/myapp/releases')
      .reply(200, [{id: 1, description: 'Attach DATABASE'}, {id: 2, description: 'Detach DATABASE'}])
      .get('/apps/myapp/releases/1')
      .reply(200, {status: 'failed', description: 'Attach DATABASE'})
      .get('/apps/myapp/releases/2')
      .reply(200, {status: 'succeeded', description: 'Attach DATABASE'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr.output, heredoc(`
      Ensuring an alternate alias for existing DATABASE_URL...
      Ensuring an alternate alias for existing DATABASE_URL... RED_URL
      Promoting PURPLE to DATABASE_URL on ⬢ myapp...
      Promoting PURPLE to DATABASE_URL on ⬢ myapp... done
      Checking release phase...
      Checking release phase... pg:promote failed because Attach DATABASE release was unsuccessful. Your application is currently running without an attached DATABASE_URL. Check your release phase logs for failure causes.
    `))
  })

  it('checks release phase for attach failure and detach success', () => {
    nock('https://api.heroku.com:')
      .get('/apps/myapp/releases')
      .reply(200, [])
    return expect(runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])).to.be.rejected
  })
})

describe('pg:promote when database is not available or force flag is present', () => {
  const addon = fixtures.addons['dwh-db']

  beforeEach(() => {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.heroku.com')
      .get('/apps/myapp/formation')
      .reply(200, [])
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200, {following: null})
  })
  afterEach(() => {
    nock.cleanAll()
  })

  it('warns user if database is unavailable', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          name: 'DATABASE',
          addon: {name: 'postgres-2'},
          namespace: null,
        }, {
          name: 'RED',
          addon: {name: 'postgres-2'},
          namespace: null,
        },
      ])
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}/wait_status`)
      .reply(200, {'waiting?': true, message: 'pending'})

    const err = heredoc(`
      Database cannot be promoted while in state: pending

      Promoting this database can lead to application errors and outage. Please run pg:wait to wait for database to become available.

      To ignore this error, you can pass the --force flag to promote the database and risk application issues.
    `)
    await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ]).catch((error: Error) => {
      expect(stripAnsi(error.message)).to.equal(err)
    })
  })

  it('promotes database in unavailable state if --force flag is present', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          name: 'DATABASE',
          addon: {name: 'postgres-2'},
          namespace: null,
        }, {
          name: 'RED',
          addon: {name: 'postgres-2'},
          namespace: null,
        },
      ])
      .post('/addon-attachments', {
        name: 'DATABASE',
        app: {name: 'myapp'},
        addon: {name: addon.name},
        namespace: null,
        confirm: 'myapp',
      })
      .reply(201)
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}/wait_status`)
      .reply(200, {'waiting?': true, message: 'pending'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--force',
      'DATABASE',
    ])
    expectOutput(stderr.output, heredoc(`
      Ensuring an alternate alias for existing DATABASE_URL...
      Ensuring an alternate alias for existing DATABASE_URL... RED_URL
      Promoting ${addon.name} to DATABASE_URL on ⬢ myapp...
      Promoting ${addon.name} to DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('promotes database in available state if --force flag is present', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          name: 'DATABASE',
          addon: {name: 'postgres-2'},
          namespace: null,
        }, {
          name: 'RED',
          addon: {name: 'postgres-2'},
          namespace: null,
        },
      ])
      .post('/addon-attachments', {
        name: 'DATABASE',
        app: {name: 'myapp'},
        addon: {name: addon.name},
        namespace: null,
        confirm: 'myapp',
      })
      .reply(201)
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}/wait_status`)
      .reply(200, {'waiting?': false, message: 'available'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--force',
      'DATABASE',
    ])
    expectOutput(stderr.output, heredoc(`
      Ensuring an alternate alias for existing DATABASE_URL...
      Ensuring an alternate alias for existing DATABASE_URL... RED_URL
      Promoting ${addon.name} to DATABASE_URL on ⬢ myapp...
      Promoting ${addon.name} to DATABASE_URL on ⬢ myapp... done
    `))
  })
})

describe('pg:promote when promoted database is a follower', () => {
  const addon = fixtures.addons['dwh-db']

  beforeEach(() => {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.heroku.com')
      .get('/apps/myapp/formation')
      .reply(200, [])
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}/wait_status`)
      .reply(200, {'waiting?': false, message: 'available'})
  })
  afterEach(() => {
    nock.cleanAll()
  })

  it('warns user if database is a follower', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          name: 'DATABASE',
          addon: {name: 'postgres-2'},
          namespace: null,
        }, {
          name: 'RED',
          addon: {name: 'postgres-2'},
          namespace: null,
        },
      ])
      .post('/addon-attachments', {
        name: 'DATABASE',
        app: {name: 'myapp'},
        addon: {name: addon.name},
        namespace: null, confirm: 'myapp',
      })
      .reply(201)
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200, {
        following: 'postgres://xxx.com:5432/abcdefghijklmn',
        leader: {
          addon_id: '5ba2ba8b-07a9-4a65-a808-585a50e37f98',
          name: 'postgresql-leader',
        },
      })

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expect(stderr.output).to.include('Your database has been promoted but it is currently a follower')
  })
})
