import {ux} from '@oclif/core'
import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout, stderr} from 'stdout-stderr'
import heredoc from 'tsheredoc'
import Cmd  from '../../../../../src/commands/pg/credentials/rotate'
import runCommand from '../../../../helpers/runCommand'
import * as sinon from 'sinon'
import stripAnsi = require('strip-ansi')

const addon = {
  id: 1, name: 'postgres-1', plan: {name: 'heroku-postgresql:standard-0'},
}

const attachments = [
  {
    namespace: 'credential:my_role', app: {name: 'appname_1'},
  }, {
    namespace: 'credential:my_role', app: {name: 'appname_2'},
  }, {
    namespace: 'credential:other_role', app: {name: 'appname_3'},
  },
]

describe('pg:credentials:rotate', async () => {
  let api: nock.Scope
  let pg: nock.Scope
  let uxWarnStub: sinon.SinonStub
  let uxPromptStub: sinon.SinonStub

  before(() => {
    uxWarnStub = sinon.stub(ux, 'warn')
    uxPromptStub = sinon.stub(ux, 'prompt').resolves('myapp')
  })

  beforeEach(async () => {
    api = nock('https://api.heroku.com')
    api.get('/addons/postgres-1/addon-attachments')
      .reply(200, attachments)
    pg = nock('https://api.data.heroku.com')
    uxWarnStub.resetHistory()
    uxPromptStub.resetHistory()
  })

  afterEach(async () => {
    nock.cleanAll()
    api.done()
  })

  after(() => {
    uxWarnStub.restore()
    uxPromptStub.restore()
  })

  describe('standard addon', () => {
    beforeEach(() => {
      api.post('/actions/addon-attachments/resolve', {
        app: 'myapp',
        addon_attachment: 'DATABASE_URL',
        addon_service: 'heroku-postgresql',
      }).reply(200, [{addon}])
    })

    it('rotates credentials for a specific role with --name', async () => {
      pg.post('/postgres/v0/databases/postgres-1/credentials/my_role/credentials_rotation')
        .reply(200)
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--name',
        'my_role',
        '--confirm',
        'myapp',
      ])
      expect(stdout.output).to.equal('')
      expect(stderr.output).to.equal(heredoc(`
        Rotating my_role on postgres-1...
        Rotating my_role on postgres-1... done
      `))
    })

    it('rotates credentials for all roles with --all', async () => {
      pg.post('/postgres/v0/databases/postgres-1/credentials_rotation')
        .reply(200)
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--all',
        '--confirm',
        'myapp',
      ])
      expect(stdout.output).to.equal('')
      expect(stderr.output).to.equal(heredoc(`
        Rotating all credentials on postgres-1...
        Rotating all credentials on postgres-1... done
      `))
    })

    it('rotates credentials for a specific role with --name and --force', async () => {
      pg.post('/postgres/v0/databases/postgres-1/credentials/my_role/credentials_rotation')
        .reply(200)
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--name',
        'my_role',
        '--confirm',
        'myapp',
        '--force',
      ])
      expect(stdout.output).to.equal('')
      expect(stderr.output).to.equal(heredoc(`
        Rotating my_role on postgres-1...
        Rotating my_role on postgres-1... done
      `))
    })

    it('fails with an error if both --all and --name are included', async () => {
      const err = 'cannot pass both --all and --name'
      return expect(runCommand(Cmd, [
        '--app',
        'myapp',
        '--all',
        '--name',
        'my_role',
        '--confirm',
        'myapp',
      ])).to.be.rejectedWith(Error, err)
    })

    it('requires app confirmation for rotating all roles with --all', async () => {
      pg.post('/postgres/v0/databases/postgres-1/credentials_rotation')
        .reply(200)
      const message = heredoc(`
      WARNING: Destructive Action
      Connections will be reset and applications will be restarted.
      This command will affect the apps ⬢ appname_1, ⬢ appname_2, ⬢ appname_3.`)
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--all',
      ])

      expect(stripAnsi(uxPromptStub.args[0].toString())).contains('To proceed, type myapp')
      expect(stripAnsi(uxWarnStub.args[0].toString())).to.eq(message)
    })

    it('requires app confirmation for rotating all roles with --all and --force', async () => {
      pg.post('/postgres/v0/databases/postgres-1/credentials_rotation')
        .reply(200)
      const message = heredoc(`
      WARNING: Destructive Action
      This forces rotation on all credentials including the default credential.
      Connections will be reset and applications will be restarted.
      Any followers lagging in replication (see heroku pg:info) will be inaccessible until caught up.
      This command will affect the apps ⬢ appname_1, ⬢ appname_2, ⬢ appname_3.`)
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--all',
        '--force',
      ])
      expect(stripAnsi(uxPromptStub.args[0].toString())).contains('To proceed, type myapp')
      expect(stripAnsi(uxWarnStub.args[0].toString())).to.eq(message)
    })
    it('requires app confirmation for rotating a specific role with --name', async () => {
      pg.post('/postgres/v0/databases/postgres-1/credentials/my_role/credentials_rotation')
        .reply(200)
      const message = heredoc(`
      WARNING: Destructive Action
      The password for the my_role credential will rotate.
      Connections older than 30 minutes will be reset, and a temporary rotation username will be used during the process.
      This command will affect the apps ⬢ appname_1, ⬢ appname_2.`)
      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--name',
        'my_role',
      ])
      expect(stripAnsi(uxPromptStub.args[0].toString())).contains('To proceed, type myapp')
      expect(stripAnsi(uxWarnStub.args[0].toString())).to.eq(message)
    })
    it('requires app confirmation for force rotating a specific role with --name and --force', async () => {
      pg.post('/postgres/v0/databases/postgres-1/credentials/my_role/credentials_rotation')
        .reply(200)
      const message = heredoc(`
      WARNING: Destructive Action
      The password for the my_role credential will rotate.
      Connections will be reset and applications will be restarted.
      Any followers lagging in replication (see heroku pg:info) will be inaccessible until caught up.
      This command will affect the apps ⬢ appname_1, ⬢ appname_2.`)

      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--name',
        'my_role',
        '--force',
      ])
      expect(stripAnsi(uxPromptStub.args[0].toString())).contains('To proceed, type myapp')
      expect(stripAnsi(uxWarnStub.args[0].toString())).to.eq(message)
    })
  })

  it('throws an error when the db is essential plan but the name is specified', async () => {
    const hobbyAddon = {
      name: 'postgres-1', plan: {name: 'heroku-postgresql:mini'},
    }

    api.post('/actions/addon-attachments/resolve', {
      app: 'myapp',
      addon_attachment: 'DATABASE_URL',
      addon_service: 'heroku-postgresql',
    }).reply(200, [{addon: hobbyAddon}])

    const err = 'Legacy Essential-tier databases do not support named credentials.'
    return expect(runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'jeff',
    ])).to.be.rejectedWith(Error, err)
  })

  it('rotates credentials when the db is numbered essential plan', async () => {
    const essentialAddon = {
      name: 'postgres-1', plan: {name: 'heroku-postgresql:essential-0'},
    }

    api.post('/actions/addon-attachments/resolve', {
      app: 'myapp',
      addon_attachment: 'DATABASE_URL',
      addon_service: 'heroku-postgresql',
    }).reply(200, [{addon: essentialAddon}])

    pg.post('/postgres/v0/databases/postgres-1/credentials/lucy/credentials_rotation')
      .reply(200)
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--name',
      'lucy',
      '--confirm',
      'myapp',
      '--force',
    ])
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal(heredoc(`
      Rotating lucy on postgres-1...
      Rotating lucy on postgres-1... done
    `))
  })

  it('rotates credentials with no --name with starter plan', async () => {
    const hobbyAddon = {
      name: 'postgres-1', plan: {name: 'heroku-postgresql:hobby-dev'},
    }

    api.post('/actions/addon-attachments/resolve', {
      app: 'myapp',
      addon_attachment: 'DATABASE_URL',
      addon_service: 'heroku-postgresql',
    }).reply(200, [{addon: hobbyAddon}])

    pg.post('/postgres/v0/databases/postgres-1/credentials/default/credentials_rotation')
      .reply(200)
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--confirm',
      'myapp',
    ])
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal(heredoc(`
      Rotating default on postgres-1...
      Rotating default on postgres-1... done
    `))
  })

  it('rotates credentials with --all with starter plan', async () => {
    const hobbyAddon = {
      name: 'postgres-1', plan: {name: 'heroku-postgresql:hobby-dev'},
    }

    api.post('/actions/addon-attachments/resolve', {
      app: 'myapp',
      addon_attachment: 'DATABASE_URL',
      addon_service: 'heroku-postgresql',
    }).reply(200, [{addon: hobbyAddon}])

    pg.post('/postgres/v0/databases/postgres-1/credentials_rotation')
      .reply(200)
    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--all',
      '--confirm',
      'myapp',
    ])
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal(heredoc(`
      Rotating all credentials on postgres-1...
      Rotating all credentials on postgres-1... done
    `))
  })
})
