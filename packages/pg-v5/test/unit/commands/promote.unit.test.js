'use strict'
/* global beforeEach afterEach */

const cli = require('@heroku/heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')

describe('pg:promote when argument is database', () => {
  let api
  let pg

  const pgbouncerAddonID = 'c667bce0-3238-4202-8550-e1dc323a02a2'

  const attachment = {
    addon: {
      name: 'postgres-1',
      id: 'c667bce0-3238-4202-8550-e1dc323a02a2',
    },
    namespace: null,
  }

  const fetcher = () => {
    return {
      attachment: () => attachment,
    }
  }

  const host = () => {
    return 'https://api.data.heroku.com'
  }

  const cmd = proxyquire('../../../commands/promote', {
    '../lib/fetcher': fetcher,
    '../lib/host': host,
  })

  beforeEach(() => {
    api = nock('https://api.heroku.com:443')
    api.get('/apps/myapp/formation').reply(200, [])
    pg = nock('https://api.data.heroku.com')
    pg.get(`/client/v11/databases/${attachment.addon.id}/wait_status`).reply(200, {message: 'available', 'waiting?': false})
    pg.get(`/client/v11/databases/${attachment.addon.id}`).reply(200, {following: null})
    api.delete(`/addon-attachments/${pgbouncerAddonID}`).reply(200)
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  it('promotes db and attaches pgbouncer if DATABASE_CONNECTION_POOL is an attachment', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-2'}, namespace: null},
      {name: 'DATABASE_CONNECTION_POOL', id: pgbouncerAddonID, addon: {name: 'postgres-2'}, namespace: 'connection-pooling:default'},
    ])
    api.post('/addon-attachments', {
      app: {name: 'myapp'},
      addon: {name: 'postgres-2'},
      namespace: null,
      confirm: 'myapp',
    }).reply(201, {name: 'RED'})
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: null,
      confirm: 'myapp',
    }).reply(201)
    api.delete(`/addon-attachments/${pgbouncerAddonID}`).reply(200)
    api.post('/addon-attachments', {
      name: 'DATABASE_CONNECTION_POOL',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: 'connection-pooling:default',
      confirm: 'myapp',
    }).reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stderr, 'to equal', `Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting postgres-1 to DATABASE_URL on myapp... done
Reattaching pooler to new leader... done
`))
  })

  it('promotes db and does not detach pgbouncers attached to new leader under other name than DATABASE_CONNECTION_POOL', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-2'}, namespace: null},
      // { name: 'DATABASE_CONNECTION_POOL', id: pgbouncerAddonID, addon: { name: 'postgres-2', id: '2' }, namespace: "connection-pooling:default" },
      {name: 'DATABASE_CONNECTION_POOL2', id: '12345', addon: {name: 'postgres-1', id: '1'}, namespace: 'connection-pooling:default'},
    ])
    api.post('/addon-attachments', {
      app: {name: 'myapp'},
      addon: {name: 'postgres-2'},
      namespace: null,
      confirm: 'myapp',
    }).reply(201, {name: 'RED'})
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: null,
      confirm: 'myapp',
    }).reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stderr, 'to equal', `Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting postgres-1 to DATABASE_URL on myapp... done
`))
  })

  it('promotes db and does not reattach pgbouncer if DATABASE_CONNECTION_POOL attached to database being promoted, but not old leader', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-2'}, namespace: null},
      {name: 'DATABASE_CONNECTION_POOL', id: '12345', addon: {name: 'postgres-1', id: '1'}, namespace: 'connection-pooling:default'},
    ])
    api.post('/addon-attachments', {
      app: {name: 'myapp'},
      addon: {name: 'postgres-2'},
      namespace: null,
      confirm: 'myapp',
    }).reply(201, {name: 'RED'})
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: null,
      confirm: 'myapp',
    }).reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stderr, 'to equal', `Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting postgres-1 to DATABASE_URL on myapp... done
`))
  })

  it('promotes the db and creates another attachment if current DATABASE does not have another', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-2'}, namespace: null},
    ])
    api.post('/addon-attachments', {
      app: {name: 'myapp'},
      addon: {name: 'postgres-2'},
      namespace: null,
      confirm: 'myapp',
    }).reply(201, {name: 'RED'})
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: null,
      confirm: 'myapp',
    }).reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stderr).to.equal(`Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting postgres-1 to DATABASE_URL on myapp... done
`))
  })

  it('promotes the db and does not create another attachment if current DATABASE has another', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-2'}, namespace: null},
      {name: 'RED', addon: {name: 'postgres-2'}, namespace: null},
    ])
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: null,
      confirm: 'myapp',
    }).reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stderr).to.equal(`Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting postgres-1 to DATABASE_URL on myapp... done
`))
  })

  it('does not promote the db if is already is DATABASE', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-1'}, namespace: null},
      {name: 'PURPLE', addon: {name: 'postgres-1'}, namespace: null},
    ])
    const err = 'postgres-1 is already promoted on myapp'
    return expect(cmd.run({app: 'myapp', args: {}, flags: {}})).to.be.rejectedWith(Error, err)
  })
})

describe('pg:promote when argument is a credential attachment', () => {
  const credentialAttachment = {
    name: 'PURPLE',
    addon: {
      name: 'postgres-1',
      id: 'c667bce0-3238-4202-8550-e1dc323a02a2',
    },
    namespace: 'credential:hello',
  }

  const fetcher = () => {
    return {
      attachment: () => credentialAttachment,
    }
  }

  const host = () => {
    return 'https://api.data.heroku.com'
  }

  const cmd = proxyquire('../../../commands/promote', {
    '../lib/fetcher': fetcher,
    '../lib/host': host,
  })

  let api
  let pg

  beforeEach(() => {
    api = nock('https://api.heroku.com:443')
    api.get('/apps/myapp/formation').reply(200, [])
    pg = nock('https://api.data.heroku.com')
    pg.get(`/client/v11/databases/${credentialAttachment.addon.id}/wait_status`).reply(200, {message: 'available', 'waiting?': false})
    pg.get(`/client/v11/databases/${credentialAttachment.addon.id}`).reply(200, {following: null})
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  it('promotes the credential and creates another attachment if current DATABASE does not have another', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-2'}},
      {name: 'RED', addon: {name: 'postgres-1'}, namespace: 'credential:hello'},
    ])
    api.post('/addon-attachments', {
      app: {name: 'myapp'},
      addon: {name: 'postgres-2'},
      confirm: 'myapp',
    }).reply(201, {name: 'RED'})
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: 'credential:hello',
      confirm: 'myapp',
    }).reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stderr).to.equal(`Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting PURPLE to DATABASE_URL on myapp... done
`))
  })

  it('promotes the credential and creates another attachment if current DATABASE does not have another and current DATABASE is a credential', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'PURPLE', addon: {name: 'postgres-1'}, namespace: 'credential:hello'},
      {name: 'DATABASE', addon: {name: 'postgres-1'}, namespace: 'credential:goodbye'},
    ])
    api.post('/addon-attachments', {
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: 'credential:goodbye',
      confirm: 'myapp',
    }).reply(201, {name: 'RED'})
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: 'credential:hello',
      confirm: 'myapp',
    }).reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stderr).to.equal(`Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting PURPLE to DATABASE_URL on myapp... done
`))
  })

  it('promotes the credential and does not create another attachment if current DATABASE has another', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-2'}},
      {name: 'RED', addon: {name: 'postgres-2'}},
      {name: 'PURPLE', addon: {name: 'postgres-1'}, namespace: 'credential:hello'},
    ])
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: 'credential:hello',
      confirm: 'myapp',
    }).reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stderr).to.equal(`Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting PURPLE to DATABASE_URL on myapp... done
`))
  })

  it('promotes the credential if the current promoted database is for the same addon, but the default credential', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-1'}, namespace: null},
      {name: 'RED', addon: {name: 'postgres-1'}, namespace: null},
      {name: 'PURPLE', addon: {name: 'postgres-1'}, namespace: 'credential:hello'},
    ])
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: 'credential:hello',
      confirm: 'myapp',
    }).reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stderr).to.equal(`Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting PURPLE to DATABASE_URL on myapp... done
`))
  })

  it('promotes the credential if the current promoted database is for the same addon, but another credential', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-1'}, namespace: 'credential:goodbye'},
      {name: 'RED', addon: {name: 'postgres-1'}, namespace: 'credential:goodbye'},
      {name: 'PURPLE', addon: {name: 'postgres-1'}, namespace: 'credential:hello'},
    ])
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: 'credential:hello',
      confirm: 'myapp',
    }).reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stderr).to.equal(`Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting PURPLE to DATABASE_URL on myapp... done
`))
  })

  it('does not promote the credential if it already is DATABASE', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'RED', addon: {name: 'postgres-1'}, namespace: null},
      {name: 'DATABASE', addon: {name: 'postgres-1'}, namespace: 'credential:hello'},
      {name: 'PURPLE', addon: {name: 'postgres-1'}, namespace: 'credential:hello'},
    ])
    const err = 'PURPLE is already promoted on myapp'
    return expect(cmd.run({app: 'myapp', args: {}, flags: {}})).to.be.rejectedWith(Error, err)
  })
})

describe('pg:promote when release phase is present', () => {
  let api
  let pg

  const addonID = 'c667bce0-3238-4202-8550-e1dc323a02a2'
  const host = () => {
    return 'https://api.data.heroku.com'
  }

  const cmd = proxyquire('../../../commands/promote', {
    '../lib/host': host,
  })

  beforeEach(() => {
    api = nock('https://api.heroku.com:443')
    api.get('/apps/myapp/formation').reply(200, [{type: 'release'}])
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-1'}, namespace: 'credential:goodbye'},
      {name: 'RED', addon: {name: 'postgres-1'}, namespace: 'credential:goodbye'},
      {name: 'PURPLE', addon: {name: 'postgres-1'}, namespace: 'credential:hello'},
    ])
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: 'credential:hello',
      confirm: 'myapp',
    }).reply(201)
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: null,
      confirm: 'myapp',
    }).reply(201)
    api.post('/actions/addon-attachments/resolve', {
      app: 'myapp',
      addon_attachment: 'DATABASE_URL',
      addon_service: 'heroku-postgresql',
    }).reply(201, [{
      name: 'PURPLE',
      addon: {name: 'postgres-1', id: addonID},
      namespace: 'credential:hello',
    }])

    pg = nock('https://api.data.heroku.com')
    pg.get(`/client/v11/databases/${addonID}/wait_status`).reply(200, {message: 'available', 'waiting?': false})
    pg.get(`/client/v11/databases/${addonID}`).reply(200, {following: null})

    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    pg.done()
    api.done()
  })

  it('checks release phase', () => {
    api.get('/apps/myapp/releases').reply(200, [{id: 1, description: 'Attach DATABASE'}, {id: 2, description: 'Detach DATABASE'}])
    api.get('/apps/myapp/releases/1').reply(200, {status: 'succeeded'})
    api.get('/apps/myapp/releases/2').reply(200, {status: 'succeeded'})
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stderr).to.equal(`Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting PURPLE to DATABASE_URL on myapp... done
Checking release phase... pg:promote succeeded.
`))
  })

  it('checks release phase for detach failure', () => {
    api.get('/apps/myapp/releases').reply(200, [{id: 1, description: 'Attach DATABASE'}, {id: 2, description: 'Detach DATABASE'}])
    api.get('/apps/myapp/releases/1').reply(200, {status: 'succeeded'})
    api.get('/apps/myapp/releases/2').reply(200, {status: 'failed', description: 'Detach DATABASE'})
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stderr).to.equal(`Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting PURPLE to DATABASE_URL on myapp... done
Checking release phase... pg:promote succeeded. It is safe to ignore the failed Detach DATABASE release.
`))
  })

  it('checks release phase for attach failure', () => {
    api.get('/apps/myapp/releases').reply(200, [{id: 1, description: 'Attach DATABASE'}, {id: 2, description: 'Detach DATABASE'}])
    api.get('/apps/myapp/releases/1').reply(200, {status: 'failed', description: 'Attach DATABASE'})
    api.get('/apps/myapp/releases/2').reply(200, {status: 'failed', description: 'Attach DATABASE'})
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stderr).to.equal(`Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting PURPLE to DATABASE_URL on myapp... done
Checking release phase... pg:promote failed because Attach DATABASE release was unsuccessful. Your application is currently running with postgres-1 attached as DATABASE_URL. Check your release phase logs for failure causes.
`))
  })

  it('checks release phase for attach failure and detach success', () => {
    api.get('/apps/myapp/releases').reply(200, [{id: 1, description: 'Attach DATABASE'}, {id: 2, description: 'Detach DATABASE'}])
    api.get('/apps/myapp/releases/1').reply(200, {status: 'failed', description: 'Attach DATABASE'})
    api.get('/apps/myapp/releases/2').reply(200, {status: 'succeeded', description: 'Attach DATABASE'})
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stderr).to.equal(`Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting PURPLE to DATABASE_URL on myapp... done
Checking release phase... pg:promote failed because Attach DATABASE release was unsuccessful. Your application is currently running without an attached DATABASE_URL. Check your release phase logs for failure causes.
`))
  })

  it('checks release phase for attach failure and detach success', () => {
    api.get('/apps/myapp/releases').reply(200, [])
    return expect(cmd.run({app: 'myapp', args: {}, flags: {}})).to.be.rejected
  })
})

describe('pg:promote when database is not available or force flag is present', () => {
  let api
  let pg

  const attachment = {
    addon: {
      name: 'postgres-1',
      id: 'c667bce0-3238-4202-8550-e1dc323a02a2',
    },
    namespace: null,
  }

  const fetcher = () => {
    return {
      attachment: () => attachment,
    }
  }

  const host = () => {
    return 'https://api.data.heroku.com'
  }

  const cmd = proxyquire('../../../commands/promote', {
    '../lib/fetcher': fetcher,
    '../lib/host': host,
  })

  beforeEach(() => {
    api = nock('https://api.heroku.com:443')
    api.get('/apps/myapp/formation').reply(200, [])
    pg = nock('https://api.data.heroku.com')
    pg.get(`/client/v11/databases/${attachment.addon.id}`).reply(200, {following: null})
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  it('warns user if database is unavailable', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-2'}, namespace: null},
      {name: 'RED', addon: {name: 'postgres-2'}, namespace: null},
    ])

    pg.get(`/client/v11/databases/${attachment.addon.id}/wait_status`).reply(200, {'waiting?': true, message: 'pending'})

    const err = `Database cannot be promoted while in state: pending
\nPromoting this database can lead to application errors and outage. Please run pg:wait to wait for database to become available.
\nTo ignore this error, you can pass the --force flag to promote the database and risk application issues.`
    return expect(cmd.run({app: 'myapp', args: {}, flags: {}})).to.be.rejectedWith(Error, err)
  })

  it('promotes database in unavailable state if --force flag is present', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-2'}, namespace: null},
      {name: 'RED', addon: {name: 'postgres-2'}, namespace: null},
    ])

    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: null,
      confirm: 'myapp',
    }).reply(201)

    pg.get(`/client/v11/databases/${attachment.addon.id}/wait_status`).reply(200, {'waiting?': true, message: 'pending'})

    return cmd.run({app: 'myapp', args: {}, flags: {force: true}})
      .then(() => expect(cli.stderr).to.equal(`Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting postgres-1 to DATABASE_URL on myapp... done\n`))
  })

  it('promotes database in available state if --force flag is present', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-2'}, namespace: null},
      {name: 'RED', addon: {name: 'postgres-2'}, namespace: null},
    ])

    pg.get(`/client/v11/databases/${attachment.addon.id}/wait_status`).reply(200, {'waiting?': false, message: 'available'})

    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: null,
      confirm: 'myapp',
    }).reply(201)

    return cmd.run({app: 'myapp', args: {}, flags: {force: true}})
      .then(() => expect(cli.stderr).to.equal(`Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting postgres-1 to DATABASE_URL on myapp... done\n`))
  })
})

describe('pg:promote when promoted database is a follower', () => {
  let api
  let pg

  const attachment = {
    addon: {
      name: 'postgres-1',
      id: 'c667bce0-3238-4202-8550-e1dc323a02a2',
    },
    namespace: null,
  }

  const fetcher = () => {
    return {
      attachment: () => attachment,
    }
  }

  const host = () => {
    return 'https://api.data.heroku.com'
  }

  const cmd = proxyquire('../../../commands/promote', {
    '../lib/fetcher': fetcher,
    '../lib/host': host,
  })

  beforeEach(() => {
    api = nock('https://api.heroku.com:443')
    api.get('/apps/myapp/formation').reply(200, [])
    pg = nock('https://api.data.heroku.com')
    pg.get(`/client/v11/databases/${attachment.addon.id}/wait_status`).reply(200, {'waiting?': false, message: 'available'})

    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  it('warns user if database is a follower', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-2'}, namespace: null},
      {name: 'RED', addon: {name: 'postgres-2'}, namespace: null},
    ])

    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: null,
      confirm: 'myapp',
    }).reply(201)

    pg.get(`/client/v11/databases/${attachment.addon.id}`).reply(200, {
      following: 'postgres://xxx.com:5432/abcdefghijklmn',
      leader: {addon_id: '5ba2ba8b-07a9-4a65-a808-585a50e37f98', name: 'postgresql-leader'},
    })

    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stderr).to.include('Your database has been promoted but it is currently a follower'))
  })
})
