import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/pg/promote.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'

const heredoc = tsheredoc.default

describe('pg:promote when argument is database', function () {
  const addon = fixtures.addons['dwh-db']
  const pgbouncerAddonID = 'c667bce0-3238-4202-8550-e1dc323a02a2'

  beforeEach(function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}/wait_status`)
      .reply(200, {message: 'available', 'waiting?': false})
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200, {following: null})
  })

  afterEach(function () {
    nock.cleanAll()
  })

  it('promotes db and attaches pgbouncer if DATABASE_CONNECTION_POOL is an attachment', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/formation')
      .reply(200, [])
      .get('/apps/myapp/addon-attachments').reply(200, [
        {
          addon: {name: 'postgres-2'},
          name: 'DATABASE',
          namespace: null,
        },
        {
          addon: {name: 'postgres-2'},
          id: pgbouncerAddonID,
          name: 'DATABASE_CONNECTION_POOL',
          namespace: 'connection-pooling:default',
        },
      ])
      .post('/addon-attachments', {
        addon: {name: 'postgres-2'},
        app: {name: 'myapp'},
        confirm: 'myapp',
        namespace: null,
      }).reply(201, {name: 'RED'})
      .post('/addon-attachments', {
        addon: {name: addon.name},
        app: {name: 'myapp'},
        confirm: 'myapp',
        name: 'DATABASE',
        namespace: null,
      }).reply(201)
      .delete(`/addon-attachments/${pgbouncerAddonID}`).reply(200)
      .post('/addon-attachments', {
        addon: {name: addon.name},
        app: {name: 'myapp'},
        confirm: 'myapp',
        name: 'DATABASE_CONNECTION_POOL',
        namespace: 'connection-pooling:default',
      }).reply(201)

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr, heredoc(`
      Ensuring an alternate alias for existing ⛁ DATABASE_URL... RED_URL
      Promoting ⛁ ${addon.name} to ⛁ DATABASE_URL on ⬢ myapp... done
      Reattaching pooler to new leader... done
    `))
  })

  it('promotes db and does not detach pgbouncers attached to new leader under other name than DATABASE_CONNECTION_POOL', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/formation')
      .reply(200, [])
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          addon: {name: 'postgres-2'},
          name: 'DATABASE',
          namespace: null,
        },
        {
          addon: {id: '1', name: addon.name},
          id: '12345',
          name: 'DATABASE_CONNECTION_POOL2',
          namespace: 'connection-pooling:default',
        },
      ])
      .post('/addon-attachments', {
        addon: {name: 'postgres-2'}, app: {name: 'myapp'}, confirm: 'myapp', namespace: null,
      })
      .reply(201, {name: 'RED'})
      .post('/addon-attachments', {
        addon: {name: addon.name}, app: {name: 'myapp'}, confirm: 'myapp', name: 'DATABASE', namespace: null,
      })
      .reply(201)

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr, heredoc(`
      Ensuring an alternate alias for existing ⛁ DATABASE_URL... RED_URL
      Promoting ⛁ ${addon.name} to ⛁ DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('promotes db and does not reattach pgbouncer if DATABASE_CONNECTION_POOL attached to database being promoted, but not old leader', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/formation')
      .reply(200, [])
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          addon: {name: 'postgres-2'},
          name: 'DATABASE',
          namespace: null,
        },
        {
          addon: {id: addon.id, name: addon.name},
          id: '12345',
          name: 'DATABASE_CONNECTION_POOL',
          namespace: 'connection-pooling:default',
        },
      ])
      .post('/addon-attachments', {
        addon: {name: 'postgres-2'}, app: {name: 'myapp'}, confirm: 'myapp', namespace: null,
      })
      .reply(201, {name: 'RED'})
      .post('/addon-attachments', {
        addon: {name: addon.name}, app: {name: 'myapp'}, confirm: 'myapp', name: 'DATABASE', namespace: null,
      })
      .reply(201)

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr, heredoc(`
      Ensuring an alternate alias for existing ⛁ DATABASE_URL... RED_URL
      Promoting ⛁ ${addon.name} to ⛁ DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('promotes the db and creates another attachment if current DATABASE does not have another', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/formation')
      .reply(200, [])
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {addon: {name: 'postgres-2'}, name: 'DATABASE', namespace: null},
      ])
      .post('/addon-attachments', {
        addon: {name: 'postgres-2'},
        app: {name: 'myapp'},
        confirm: 'myapp',
        namespace: null,
      })
      .reply(201, {name: 'RED'})
      .post('/addon-attachments', {
        addon: {name: addon.name},
        app: {name: 'myapp'},
        confirm: 'myapp',
        name: 'DATABASE',
        namespace: null,
      })
      .reply(201)

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr, heredoc(`
      Ensuring an alternate alias for existing ⛁ DATABASE_URL... RED_URL
      Promoting ⛁ ${addon.name} to ⛁ DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('promotes the db and does not create another attachment if current DATABASE has another', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/formation')
      .reply(200, [])
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          addon: {name: 'postgres-2'},
          name: 'DATABASE',
          namespace: null,
        },
        {
          addon: {name: 'postgres-2'},
          name: 'RED',
          namespace: null,
        },
      ])
      .post('/addon-attachments', {
        addon: {name: addon.name},
        app: {name: 'myapp'},
        confirm: 'myapp',
        name: 'DATABASE',
        namespace: null,
      })
      .reply(201)

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr, heredoc(`
      Ensuring an alternate alias for existing ⛁ DATABASE_URL... RED_URL
      Promoting ⛁ ${addon.name} to ⛁ DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('does not promote the db if is already is DATABASE', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/formation')
      .reply(200, [])
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {addon: {name: addon.name}, name: 'DATABASE', namespace: null},
        {addon: {name: addon.name}, name: 'PURPLE', namespace: null},
      ])
    const err = `${addon.name} is already promoted on ⬢ myapp`
    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expect(ansis.strip(error!.message)).to.equal(err)
  })

  it('promotes when the db is not a follower and has no DATABASE attachment exists', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {addon: {name: addon.name}, name: 'PURPLE', namespace: null},
      ])
      .post('/addon-attachments', {
        addon: {name: addon.name},
        app: {name: 'myapp'},
        confirm: 'myapp',
        name: 'DATABASE',
        namespace: null,
      })
      .reply(201)
      .get('/apps/myapp/formation')
      .reply(200, [
        {type: 'release'},
      ])
      .get('/apps/myapp/releases')
      .reply(200, [
        {description: 'Attach DATABASE', id: 1},
        {description: 'Detach DATABASE', id: 2},
      ])
      .get('/apps/myapp/releases/1')
      .reply(200, {status: 'succeeded'})
      .get('/apps/myapp/releases/2')
      .reply(200, {status: 'succeeded'})

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'dwh-db',
    ])
    expectOutput(stderr, heredoc(`
      Ensuring an alternate alias for existing ⛁ DATABASE_URL... Promoting ⛁ dwh-db to ⛁ DATABASE_URL on ⬢ myapp... done
      Checking release phase... pg:promote succeeded.
    `))
  })
})

describe('pg:promote when argument is a credential attachment', function () {
  const addon = fixtures.addons['dwh-db']

  beforeEach(function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve', {
        addon_attachment: 'DATABASE',
        app: 'myapp',
      })
      .reply(200, [{addon, name: 'PURPLE', namespace: 'credential:hello'}])
      .get('/apps/myapp/formation')
      .reply(200, [])
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}/wait_status`)
      .reply(200, {message: 'available', 'waiting?': false})
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200, {following: null})
  })

  afterEach(function () {
    nock.cleanAll()
  })

  it('promotes the credential and creates another attachment if current DATABASE does not have another', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          addon: {name: 'postgres-2'},
          name: 'DATABASE',
        },
        {
          addon: {name: addon.name},
          name: 'RED',
          namespace: 'credential:hello',
        },
      ])
      .post('/addon-attachments', {
        addon: {name: 'postgres-2'}, app: {name: 'myapp'}, confirm: 'myapp',
      })
      .reply(201, {name: 'RED'})
      .post('/addon-attachments', {
        addon: {name: addon.name},
        app: {name: 'myapp'},
        confirm: 'myapp',
        name: 'DATABASE',
        namespace: 'credential:hello',
      })
      .reply(201)

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr, heredoc(`
      Ensuring an alternate alias for existing ⛁ DATABASE_URL... RED_URL
      Promoting PURPLE to ⛁ DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('promotes the credential and creates another attachment if current DATABASE does not have another and current DATABASE is a credential', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          addon: {name: addon.name},
          name: 'PURPLE',
          namespace: 'credential:hello',
        },
        {
          addon: {name: addon.name},
          name: 'DATABASE',
          namespace: 'credential:goodbye',
        },
      ])
      .post('/addon-attachments', {
        addon: {name: addon.name},
        app: {name: 'myapp'},
        confirm: 'myapp',
        namespace: 'credential:goodbye',
      })
      .reply(201, {name: 'RED'})
      .post('/addon-attachments', {
        addon: {name: addon.name},
        app: {name: 'myapp'},
        confirm: 'myapp',
        name: 'DATABASE',
        namespace: 'credential:hello',
      })
      .reply(201)

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr, heredoc(`
      Ensuring an alternate alias for existing ⛁ DATABASE_URL... RED_URL
      Promoting PURPLE to ⛁ DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('promotes the credential and does not create another attachment if current DATABASE has another', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          addon: {name: 'postgres-2'},
          name: 'DATABASE',
        },
        {
          addon: {name: 'postgres-2'},
          name: 'RED',
        },
        {
          addon: {name: addon.name},
          name: 'PURPLE',
          namespace: 'credential:hello',
        },
      ])
      .post('/addon-attachments', {
        addon: {name: addon.name}, app: {name: 'myapp'}, confirm: 'myapp', name: 'DATABASE', namespace: 'credential:hello',
      })
      .reply(201)

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr, heredoc(`
      Ensuring an alternate alias for existing ⛁ DATABASE_URL... RED_URL
      Promoting PURPLE to ⛁ DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('promotes the credential if the current promoted database is for the same addon, but the default credential', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          addon: {name: addon.name},
          name: 'DATABASE',
          namespace: null,
        }, {
          addon: {name: addon.name}, name: 'RED',
          namespace: null,
        }, {
          addon: {name: addon.name},
          name: 'PURPLE',
          namespace: 'credential:hello',
        },
      ])
      .post('/addon-attachments', {
        addon: {name: addon.name},
        app: {name: 'myapp'},
        confirm: 'myapp',
        name: 'DATABASE',
        namespace: 'credential:hello',
      })
      .reply(201)

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr, heredoc(`
      Ensuring an alternate alias for existing ⛁ DATABASE_URL... RED_URL
      Promoting PURPLE to ⛁ DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('promotes the credential if the current promoted database is for the same addon, but another credential', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          addon: {name: addon.name},
          name: 'DATABASE',
          namespace: 'credential:goodbye',
        }, {
          addon: {name: addon.name},
          name: 'RED',
          namespace: 'credential:goodbye',
        }, {
          addon: {name: addon.name},
          name: 'PURPLE',
          namespace: 'credential:hello',
        },
      ])
      .post('/addon-attachments', {
        addon: {name: addon.name},
        app: {name: 'myapp'},
        confirm: 'myapp',
        name: 'DATABASE',
        namespace: 'credential:hello',
      })
      .reply(201)

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr, heredoc(`
      Ensuring an alternate alias for existing ⛁ DATABASE_URL... RED_URL
      Promoting PURPLE to ⛁ DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('does not promote the credential if it already is DATABASE', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          addon: {name: addon.name},
          name: 'RED', namespace: null,
        }, {
          addon: {name: addon.name},
          name: 'DATABASE',
          namespace: 'credential:hello',
        }, {
          addon: {name: addon.name},
          name: 'PURPLE',
          namespace: 'credential:hello',
        },
      ])
    const err = 'PURPLE is already promoted on ⬢ myapp'
    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expect(ansis.strip(error!.message)).to.equal(err)
  })
})

describe('pg:promote when release phase is present', function () {
  const addon = fixtures.addons['dwh-db']

  beforeEach(function () {
    nock('https://api.heroku.com:')
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'release'}])
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          addon: {name: addon.name},
          name: 'DATABASE',
          namespace: 'credential:goodbye',
        }, {
          addon: {name: addon.name},
          name: 'RED',
          namespace: 'credential:goodbye',
        }, {
          addon: {name: addon.name},
          name: 'PURPLE',
          namespace: 'credential:hello',
        },
      ])
      .post('/addon-attachments', {
        addon: {name: addon.name},
        app: {name: 'myapp'},
        confirm: 'myapp',
        name: 'DATABASE',
        namespace: 'credential:hello',
      })
      .reply(201)
      .post('/addon-attachments', {
        addon: {name: addon.name}, app: {name: 'myapp'}, confirm: 'myapp', name: 'DATABASE', namespace: null,
      })
      .reply(201)
      .post('/actions/addon-attachments/resolve', {
        addon_attachment: 'DATABASE', app: 'myapp',
      })
      .reply(201, [{
        addon: {id: addon.id, name: addon.name, plan: {id: addon.plan!.id, name: addon.plan!.name}}, name: 'PURPLE', namespace: 'credential:hello',
      }])
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}/wait_status`)
      .reply(200, {message: 'available', 'waiting?': false})
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200, {following: null})
  })

  afterEach(function () {
    nock.cleanAll()
  })

  it('checks release phase', async function () {
    nock('https://api.heroku.com:')
      .get('/apps/myapp/releases')
      .reply(200, [{description: 'Attach DATABASE', id: 1}, {description: 'Detach DATABASE', id: 2}])
      .get('/apps/myapp/releases/1')
      .reply(200, {status: 'succeeded'})
      .get('/apps/myapp/releases/2')
      .reply(200, {status: 'succeeded'})

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr, heredoc(`
      Ensuring an alternate alias for existing ⛁ DATABASE_URL... RED_URL
      Promoting PURPLE to ⛁ DATABASE_URL on ⬢ myapp... done
      Checking release phase... pg:promote succeeded.
    `))
  })

  it('checks release phase for detach failure', async function () {
    nock('https://api.heroku.com:')
      .get('/apps/myapp/releases')
      .reply(200, [{description: 'Attach DATABASE', id: 1}, {description: 'Detach DATABASE', id: 2}])
      .get('/apps/myapp/releases/1')
      .reply(200, {status: 'succeeded'})
      .get('/apps/myapp/releases/2')
      .reply(200, {description: 'Detach DATABASE', status: 'failed'})

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr, heredoc(`
      Ensuring an alternate alias for existing ⛁ DATABASE_URL... RED_URL
      Promoting PURPLE to ⛁ DATABASE_URL on ⬢ myapp... done
      Checking release phase... pg:promote succeeded. It is safe to ignore the failed Detach DATABASE release.
    `))
  })

  it('checks release phase for attach failure', async function () {
    nock('https://api.heroku.com:')
      .get('/apps/myapp/releases')
      .reply(200, [{description: 'Attach DATABASE', id: 1}, {description: 'Detach DATABASE', id: 2}])
      .get('/apps/myapp/releases/1')
      .reply(200, {description: 'Attach DATABASE', status: 'failed'})
      .get('/apps/myapp/releases/2')
      .reply(200, {description: 'Attach DATABASE', status: 'failed'})

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr, heredoc(`
      Ensuring an alternate alias for existing ⛁ DATABASE_URL... RED_URL
      Promoting PURPLE to ⛁ DATABASE_URL on ⬢ myapp... done
      Checking release phase... pg:promote failed because Attach DATABASE release was unsuccessful. Your application is currently running with ${addon.name} attached as DATABASE_URL. Check your release phase logs for failure causes.
    `))
  })

  it('checks release phase for attach failure and detach success', async function () {
    nock('https://api.heroku.com:')
      .get('/apps/myapp/releases')
      .reply(200, [{description: 'Attach DATABASE', id: 1}, {description: 'Detach DATABASE', id: 2}])
      .get('/apps/myapp/releases/1')
      .reply(200, {description: 'Attach DATABASE', status: 'failed'})
      .get('/apps/myapp/releases/2')
      .reply(200, {description: 'Attach DATABASE', status: 'succeeded'})

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expectOutput(stderr, heredoc(`
      Ensuring an alternate alias for existing ⛁ DATABASE_URL... RED_URL
      Promoting PURPLE to ⛁ DATABASE_URL on ⬢ myapp... done
      Checking release phase... pg:promote failed because Attach DATABASE release was unsuccessful. Your application is currently running without an attached DATABASE_URL. Check your release phase logs for failure causes.
    `))
  })

  it('errors when there are no releases', function () {
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

describe('pg:promote when database is not available or force flag is present', function () {
  const addon = fixtures.addons['dwh-db']

  beforeEach(function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
      .get('/apps/myapp/formation')
      .reply(200, [])
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}`)
      .reply(200, {following: null})
  })

  afterEach(function () {
    nock.cleanAll()
  })

  it('warns user if database is unavailable', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          addon: {name: 'postgres-2'},
          name: 'DATABASE',
          namespace: null,
        }, {
          addon: {name: 'postgres-2'},
          name: 'RED',
          namespace: null,
        },
      ])
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}/wait_status`)
      .reply(200, {message: 'pending', 'waiting?': true})

    const err = heredoc(`
      Database cannot be promoted while in state: pending

      Promoting this database can lead to application errors and outage. Please run heroku pg:wait to wait for database to become available.

      To ignore this error, you can pass the --force flag to promote the database and risk application issues.
    `)
    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expect(ansis.strip(error!.message)).to.equal(err)
  })

  it('promotes database in unavailable state if --force flag is present', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          addon: {name: 'postgres-2'},
          name: 'DATABASE',
          namespace: null,
        }, {
          addon: {name: 'postgres-2'},
          name: 'RED',
          namespace: null,
        },
      ])
      .post('/addon-attachments', {
        addon: {name: addon.name},
        app: {name: 'myapp'},
        confirm: 'myapp',
        name: 'DATABASE',
        namespace: null,
      })
      .reply(201)
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}/wait_status`)
      .reply(200, {message: 'pending', 'waiting?': true})

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--force',
      'DATABASE',
    ])
    expectOutput(stderr, heredoc(`
      Ensuring an alternate alias for existing ⛁ DATABASE_URL... RED_URL
      Promoting ⛁ ${addon.name} to ⛁ DATABASE_URL on ⬢ myapp... done
    `))
  })

  it('promotes database in available state if --force flag is present', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          addon: {name: 'postgres-2'},
          name: 'DATABASE',
          namespace: null,
        }, {
          addon: {name: 'postgres-2'},
          name: 'RED',
          namespace: null,
        },
      ])
      .post('/addon-attachments', {
        addon: {name: addon.name},
        app: {name: 'myapp'},
        confirm: 'myapp',
        name: 'DATABASE',
        namespace: null,
      })
      .reply(201)
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}/wait_status`)
      .reply(200, {message: 'available', 'waiting?': false})

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      '--force',
      'DATABASE',
    ])
    expectOutput(stderr, heredoc(`
      Ensuring an alternate alias for existing ⛁ DATABASE_URL... RED_URL
      Promoting ⛁ ${addon.name} to ⛁ DATABASE_URL on ⬢ myapp... done
    `))
  })
})

describe('pg:promote when promoted database is a follower', function () {
  const addon = fixtures.addons['dwh-db']

  beforeEach(function () {
    nock('https://api.heroku.com')
      .post('/actions/addon-attachments/resolve')
      .reply(200, [{addon}])
      .get('/apps/myapp/formation')
      .reply(200, [])
    nock('https://api.data.heroku.com')
      .get(`/client/v11/databases/${addon.id}/wait_status`)
      .reply(200, {message: 'available', 'waiting?': false})
  })

  afterEach(function () {
    nock.cleanAll()
  })

  it('warns user if database is a follower', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/addon-attachments')
      .reply(200, [
        {
          addon: {name: 'postgres-2'},
          name: 'DATABASE',
          namespace: null,
        }, {
          addon: {name: 'postgres-2'},
          name: 'RED',
          namespace: null,
        },
      ])
      .post('/addon-attachments', {
        addon: {name: addon.name},
        app: {name: 'myapp'},
        confirm: 'myapp',
        name: 'DATABASE', namespace: null,
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

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'DATABASE',
    ])
    expect(stderr).to.include('Your database has been promoted but it is currently a follower')
  })
})
