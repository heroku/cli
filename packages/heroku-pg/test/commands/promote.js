'use strict'
/* global describe it beforeEach afterEach */

const cli = require('heroku-cli-util')
const expect = require('unexpected')
const nock = require('nock')
const proxyquire = require('proxyquire')

describe('pg:promote when argument is database', () => {
  let api

  const attachment = {
    addon: {
      name: 'postgres-1'
    },
    namespace: null
  }

  const fetcher = () => {
    return {
      attachment: () => attachment
    }
  }

  const cmd = proxyquire('../../commands/promote', {
    '../lib/fetcher': fetcher
  })

  beforeEach(() => {
    api = nock('https://api.heroku.com:443')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
  })

  it('promotes the db and creates another attachment if current DATABASE does not have another', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-2'}, namespace: null}
    ])
    api.post('/addon-attachments', {
      app: {name: 'myapp'},
      addon: {name: 'postgres-2'},
      namespace: null,
      confirm: 'myapp'
    }).reply(201, {name: 'RED'})
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: null,
      confirm: 'myapp'
    }).reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
    .then(() => expect(cli.stderr, 'to equal', `Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting postgres-1 to DATABASE_URL on myapp... done
`))
  })

  it('promotes the db and does not create another attachment if current DATABASE has another', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-2'}, namespace: null},
      {name: 'PURPLE', addon: {name: 'postgres-2'}, namespace: null}
    ])
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: null,
      confirm: 'myapp'
    }).reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
    .then(() => expect(cli.stderr, 'to equal', `Ensuring an alternate alias for existing DATABASE_URL... PURPLE_URL
Promoting postgres-1 to DATABASE_URL on myapp... done
`))
  })

  it('does not promote the db if is already is DATABASE', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-1'}, namespace: null},
      {name: 'PURPLE', addon: {name: 'postgres-1'}, namespace: null}
    ])
    const err = new Error(`postgres-1 is already promoted on myapp`)
    return expect(cmd.run({app: 'myapp', args: {}, flags: {}}), 'to be rejected with', err)
  })
})

describe('pg:promote when argument is a credential attachment', () => {
  const credentialAttachment = {
    name: 'PURPLE',
    addon: {name: 'postgres-1'},
    namespace: 'credential:hello'
  }

  const fetcher = () => {
    return {
      attachment: () => credentialAttachment
    }
  }

  const cmd = proxyquire('../../commands/promote', {
    '../lib/fetcher': fetcher
  })

  let api

  beforeEach(() => {
    api = nock('https://api.heroku.com:443')
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
  })

  it('promotes the credential and creates another attachment if current DATABASE does not have another', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-2'}},
      {name: 'PURPLE', addon: {name: 'postgres-1'}, namespace: 'credential:hello'}
    ])
    api.post('/addon-attachments', {
      app: {name: 'myapp'},
      addon: {name: 'postgres-2'},
      confirm: 'myapp'
    }).reply(201, {name: 'RED'})
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: 'credential:hello',
      confirm: 'myapp'
    }).reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
    .then(() => expect(cli.stderr, 'to equal', `Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting PURPLE to DATABASE_URL on myapp... done
`))
  })

  it('promotes the credential and creates another attachment if current DATABASE does not have another and current DATABASE is a credential', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'PURPLE', addon: {name: 'postgres-1'}, namespace: 'credential:hello'},
      {name: 'DATABASE', addon: {name: 'postgres-1'}, namespace: 'credential:goodbye'}
    ])
    api.post('/addon-attachments', {
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: 'credential:goodbye',
      confirm: 'myapp'
    }).reply(201, {name: 'RED'})
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: 'credential:hello',
      confirm: 'myapp'
    }).reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
    .then(() => expect(cli.stderr, 'to equal', `Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting PURPLE to DATABASE_URL on myapp... done
`))
  })

  it('promotes the credential and does not create another attachment if current DATABASE has another', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-2'}},
      {name: 'BLUE', addon: {name: 'postgres-2'}},
      {name: 'PURPLE', addon: {name: 'postgres-1'}, namespace: 'credential:hello'}
    ])
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: 'credential:hello',
      confirm: 'myapp'
    }).reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
    .then(() => expect(cli.stderr, 'to equal', `Ensuring an alternate alias for existing DATABASE_URL... BLUE_URL
Promoting PURPLE to DATABASE_URL on myapp... done
`))
  })

  it('promotes the credential if the current promoted database is for the same addon, but the default credential', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-1'}, namespace: null},
      {name: 'RED', addon: {name: 'postgres-1'}, namespace: null},
      {name: 'PURPLE', addon: {name: 'postgres-1'}, namespace: 'credential:hello'}
    ])
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: 'credential:hello',
      confirm: 'myapp'
    }).reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
    .then(() => expect(cli.stderr, 'to equal', `Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting PURPLE to DATABASE_URL on myapp... done
`))
  })

  it('promotes the credential if the current promoted database is for the same addon, but the default credential', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-1'}, namespace: null},
      {name: 'RED', addon: {name: 'postgres-1'}, namespace: null},
      {name: 'PURPLE', addon: {name: 'postgres-1'}, namespace: 'credential:hello'}
    ])
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: 'credential:hello',
      confirm: 'myapp'
    }).reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
    .then(() => expect(cli.stderr, 'to equal', `Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting PURPLE to DATABASE_URL on myapp... done
`))
  })

  it('promotes the credential if the current promoted database is for the same addon, but another credential', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'DATABASE', addon: {name: 'postgres-1'}, namespace: 'credential:goodbye'},
      {name: 'RED', addon: {name: 'postgres-1'}, namespace: 'credential:goodbye'},
      {name: 'PURPLE', addon: {name: 'postgres-1'}, namespace: 'credential:hello'}
    ])
    api.post('/addon-attachments', {
      name: 'DATABASE',
      app: {name: 'myapp'},
      addon: {name: 'postgres-1'},
      namespace: 'credential:hello',
      confirm: 'myapp'
    }).reply(201)
    return cmd.run({app: 'myapp', args: {}, flags: {}})
    .then(() => expect(cli.stderr, 'to equal', `Ensuring an alternate alias for existing DATABASE_URL... RED_URL
Promoting PURPLE to DATABASE_URL on myapp... done
`))
  })

  it('does not promote the credential if it already is DATABASE', () => {
    api.get('/apps/myapp/addon-attachments').reply(200, [
      {name: 'RED', addon: {name: 'postgres-1'}, namespace: null},
      {name: 'DATABASE', addon: {name: 'postgres-1'}, namespace: 'credential:hello'},
      {name: 'PURPLE', addon: {name: 'postgres-1'}, namespace: 'credential:hello'}
    ])
    const err = new Error(`PURPLE is already promoted on myapp`)
    return expect(cmd.run({app: 'myapp', args: {}, flags: {}}), 'to be rejected with', err)
  })
})
