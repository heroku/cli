/*
import runCommand from '../../../helpers/runCommand.js'
import {expect} from 'chai'
import heredoc from 'tsheredoc'
import * as sinon from 'sinon'
import * as proxyquire from 'proxyquire'
import {GenericCmd} from '../../../helpers/runCommand'

describe('pg:kill', function () {
  let databaseResolverStub: sinon.SinonStub
  let psqlServiceExecQuerySpy: sinon.SinonSpy
  let Cmd: GenericCmd
  let queryString = ''

  beforeEach(function () {
    databaseResolverStub = sinon.stub().resolves({})
    psqlServiceExecQuerySpy = sinon.spy((query: string) => {
      queryString = heredoc(query).trim()
      return Promise.resolve('')
    })

    // Mock the utils.pg classes
    const mockUtils = {
      pg: {
        DatabaseResolver: class {
          getDatabase = databaseResolverStub
        },
        PsqlService: class {
          execQuery = psqlServiceExecQuerySpy
        },
      },
    }

    Cmd = proxyquire('../../../../src/commands/pg/kill', {
      '@heroku/heroku-cli-util': {
        utils: mockUtils,
      },
    }).default
  })

  afterEach(function () {
    queryString = ''
    sinon.restore()
  })

  it('kills pid 100', async function () {
    await runCommand(Cmd, [
      '100',
      '--app',
      'myapp',
    ])

    expect(queryString).to.eq('SELECT pg_cancel_backend(100);')
  })

  it('force kills pid 100', async function () {
    await runCommand(Cmd, [
      '100',
      '--app',
      'myapp',
      '--force',
    ])

    expect(queryString).to.eq('SELECT pg_terminate_backend(100);')
  })
})

*/
