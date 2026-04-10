import {expect} from 'chai'
import * as childProcess from 'node:child_process'
import {EventEmitter} from 'node:events'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import * as sinon from 'sinon'

import MCPStart from '../../../../src/commands/mcp/start.js'
import {runCommand} from '../../../helpers/run-command.js'

class MockStream extends EventEmitter {
  end() {
    return this
  }

  pipe() {
    return this
  }

  unpipe() {
    return this
  }
}

class MockServerProcess extends EventEmitter {
  public kill = sinon.stub()
  public stderr = new MockStream()
  public stdin = new MockStream()
  public stdout = new MockStream()

  public [Symbol.dispose]() {}
}

describe('mcp:start', function () {
  let spawnStub: sinon.SinonStub
  let serverStub: MockServerProcess

  beforeEach(function () {
    spawnStub = sinon.stub(MCPStart, 'spawn').callsFake(() => {
      serverStub = new MockServerProcess()

      setTimeout(() => serverStub.stderr?.emit('data', 'test data'), 50)
      setTimeout(() => serverStub.stdout?.emit('data', 'more test data'), 60)
      setTimeout(() => serverStub.emit('exit', 0), 70)
      return serverStub as unknown as childProcess.ChildProcess
    })
  })

  afterEach(function () {
    spawnStub.restore()
  })

  it('spawns the server with correct arguments and pipes stdio', async function () {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    const serverPath = join(currentDir, '../../../../node_modules/@heroku/mcp-server/bin/heroku-mcp-server.mjs')

    await runCommand(MCPStart, [])
    expect(spawnStub.calledOnce).to.be.true
    expect(spawnStub.args[0]).to.deep.equal(['node', [serverPath], {
      shell: true,
      stdio: [
        'pipe',
        'pipe',
        'pipe',
      ],
    }])
  })

  it('handles SIGINT and SIGTERM signals', async function () {
    const {result: server} = await runCommand(MCPStart, [])
    process.emit('SIGINT')
    process.emit('SIGTERM')
    expect(spawnStub.calledOnce).to.be.true
    expect((server as MockServerProcess).kill.calledTwice).to.be.true
  })

  it('returns the server process', async function () {
    const {result} = await runCommand(MCPStart, [])
    expect(result instanceof MockServerProcess).to.be.true
  })
})
