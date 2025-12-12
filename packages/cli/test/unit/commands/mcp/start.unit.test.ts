import {expect} from 'chai'
import * as child_process from 'node:child_process'
import {EventEmitter} from 'node:events'
import {fileURLToPath} from 'node:url'
import {join} from 'path'
import * as sinon from 'sinon'
import MCPStart from '../../../../src/commands/mcp/start.js'

import runCommand from '../../../helpers/runCommand.js'

class MockStream extends EventEmitter {
  pipe() {
    return this
  }

  unpipe() {
    return this
  }

  end() {
    return this
  }
}

class MockServerProcess extends EventEmitter {
  public stderr = new MockStream()
  public stdout = new MockStream()
  public stdin = new MockStream()

  public [Symbol.dispose]() {}

  public kill = sinon.stub()
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
      return serverStub as unknown as child_process.ChildProcess
    })
  })

  afterEach(function () {
    spawnStub.restore()
  })

  it('spawns the server with correct arguments and pipes stdio', async function () {
    const serverPath = join(fileURLToPath(await import.meta.resolve('@heroku/mcp-server')), '../../bin/heroku-mcp-server.mjs')

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
    const server = await runCommand(MCPStart, [])
    process.emit('SIGINT')
    process.emit('SIGTERM')
    expect(spawnStub.calledOnce).to.be.true
    expect(server.kill.calledTwice).to.be.true
  })

  it('returns the server process', async function () {
    const result = await runCommand(MCPStart, [])
    expect(result instanceof MockServerProcess).to.be.true
  })
})
