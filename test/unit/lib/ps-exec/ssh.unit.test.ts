import socks from '@heroku/socksv5'
import {ux} from '@oclif/core'
import {expect} from 'chai'
import child from 'child_process'
import cliProgress from 'cli-progress'
import sinon from 'sinon'
import {Client} from 'ssh2'

import {HerokuSsh} from '../../../../src/lib/ps-exec/ssh.js'

function makeStream() {
  const handlers: Record<string, Array<(...args: unknown[]) => void>> = {}
  const stderrHandlers: Record<string, Array<(...args: unknown[]) => void>> = {}
  const stderr = {
    on(event: string, handler: (...args: unknown[]) => void) {
      stderrHandlers[event] = stderrHandlers[event] ?? []
      stderrHandlers[event].push(handler)
      return stderr
    },
  }
  const s = {
    emit(event: string, ...args: unknown[]) {
      for (const handler of handlers[event] ?? []) handler(...args)
      return true
    },
    on(event: string, handler: (...args: unknown[]) => void) {
      handlers[event] = handlers[event] ?? []
      handlers[event].push(handler)
      return s
    },
    pipe: sinon.stub().returnsThis() as sinon.SinonStub,
    stderr,
  }
  return s
}

describe('ssh lib', function () {
  let capturedClient: Client
  let clientConnectStub: sinon.SinonStub
  let clientExecStub: sinon.SinonStub
  let clientShellStub: sinon.SinonStub
  let clientEndStub: sinon.SinonStub
  let clientSftpStub: sinon.SinonStub
  let uxErrorStub: sinon.SinonStub
  let sshInstance: HerokuSsh
  let originalMaxListeners: number
  let originalSigintListeners: NodeJS.SignalsListener[]

  beforeEach(function () {
    originalMaxListeners = process.getMaxListeners()
    originalSigintListeners = process.listeners('SIGINT')
    process.setMaxListeners(50)
    clientConnectStub = sinon.stub(Client.prototype, 'connect').callsFake(function (this: Client) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias, unicorn/no-this-assignment
      capturedClient = this
      return this
    } as () => Client)
    clientExecStub = sinon.stub(Client.prototype, 'exec')
    clientShellStub = sinon.stub(Client.prototype, 'shell')
    clientEndStub = sinon.stub(Client.prototype, 'end')
    clientSftpStub = sinon.stub(Client.prototype, 'sftp')
    sinon.stub(ux.action, 'stop')
    uxErrorStub = sinon.stub(ux, 'error')
    sshInstance = new HerokuSsh()
  })

  afterEach(function () {
    sinon.restore()
    process.setMaxListeners(originalMaxListeners)
    process.removeAllListeners('SIGINT')
    for (const listener of originalSigintListeners) {
      process.on('SIGINT', listener as (signal: NodeJS.Signals) => void)
    }
  })

  describe('connect()', function () {
    describe('shell mode', function () {
      it('opens a shell when no args are provided', async function () {
        const mockStream = makeStream()
        clientShellStub.callsFake((cb: (err: Error | null, stream: ReturnType<typeof makeStream>) => void) => cb(null, mockStream))

        const p = sshInstance.connect({args: []}, 'addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
        setImmediate(() => {
          capturedClient.emit('ready')
          setImmediate(mockStream.emit.bind(mockStream, 'close'))
        })

        await p
        expect(clientShellStub.calledOnce).to.be.true
        expect(clientExecStub.called).to.be.false
      })

      it('opens a shell when args include "bash"', async function () {
        const mockStream = makeStream()
        clientShellStub.callsFake((cb: (err: Error | null, stream: ReturnType<typeof makeStream>) => void) => cb(null, mockStream))

        const p = sshInstance.connect({args: ['bash']}, 'addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
        setImmediate(() => {
          capturedClient.emit('ready')
          setImmediate(mockStream.emit.bind(mockStream, 'close'))
        })

        await p
        expect(clientShellStub.calledOnce).to.be.true
        expect(clientExecStub.called).to.be.false
      })

      it('ends the connection when the shell stream closes', async function () {
        const mockStream = makeStream()
        clientShellStub.callsFake((cb: (err: Error | null, stream: ReturnType<typeof makeStream>) => void) => cb(null, mockStream))

        const p = sshInstance.connect({args: []}, 'addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
        setImmediate(() => {
          capturedClient.emit('ready')
          setImmediate(mockStream.emit.bind(mockStream, 'close'))
        })

        await p
        expect(clientEndStub.calledOnce).to.be.true
      })

      it('rejects and logs error when shell session errors', async function () {
        clientShellStub.callsFake((cb: (err: Error | null, stream?: ReturnType<typeof makeStream>) => void) => cb(new Error('shell failed')))

        sshInstance.connect({args: []}, 'addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
        setImmediate(() => capturedClient.emit('ready'))

        await new Promise<void>(resolve => {
          setImmediate(resolve)
        })
        expect(uxErrorStub.calledOnce).to.be.true
      })
    })

    describe('exec mode', function () {
      it('calls conn.exec with a single arg unchanged', async function () {
        const mockStream = makeStream()
        clientExecStub.callsFake((_cmd: string, _opts: {pty: boolean}, cb: (err: Error | null, stream: ReturnType<typeof makeStream>) => void) => cb(null, mockStream))

        const p = sshInstance.connect({args: ['rake test']}, 'addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
        setImmediate(() => {
          capturedClient.emit('ready')
          setImmediate(() => mockStream.emit('close'))
        })

        await p
        expect(clientExecStub.calledOnce).to.be.true
        expect(clientExecStub.firstCall.args[0]).to.equal('rake test')
      })

      it('joins multiple args with spaces', async function () {
        const mockStream = makeStream()
        clientExecStub.callsFake((_cmd: string, _opts: {pty: boolean}, cb: (err: Error | null, stream: ReturnType<typeof makeStream>) => void) => cb(null, mockStream))

        const p = sshInstance.connect({args: ['rake', 'test']}, 'addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
        setImmediate(() => {
          capturedClient.emit('ready')
          setImmediate(() => mockStream.emit('close'))
        })

        await p
        expect(clientExecStub.firstCall.args[0]).to.equal('rake test')
      })

      it('wraps args containing spaces in double quotes', async function () {
        const mockStream = makeStream()
        clientExecStub.callsFake((_cmd: string, _opts: {pty: boolean}, cb: (err: Error | null, stream: ReturnType<typeof makeStream>) => void) => cb(null, mockStream))

        const p = sshInstance.connect({args: ['echo', 'hello world']}, 'addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
        setImmediate(() => {
          capturedClient.emit('ready')
          setImmediate(() => mockStream.emit('close'))
        })

        await p
        expect(clientExecStub.firstCall.args[0]).to.equal('echo "hello world"')
      })

      it('escapes double quotes within args', async function () {
        const mockStream = makeStream()
        clientExecStub.callsFake((_cmd: string, _opts: {pty: boolean}, cb: (err: Error | null, stream: ReturnType<typeof makeStream>) => void) => cb(null, mockStream))

        const p = sshInstance.connect({args: ['echo', '"hello"']}, 'addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
        setImmediate(() => {
          capturedClient.emit('ready')
          setImmediate(() => mockStream.emit('close'))
        })

        await p
        expect(clientExecStub.firstCall.args[0]).to.equal('echo "\\"hello\\""')
      })

      it('invokes callback after stream closes', async function () {
        const mockStream = makeStream()
        clientExecStub.callsFake((_cmd: string, _opts: {pty: boolean}, cb: (err: Error | null, stream: ReturnType<typeof makeStream>) => void) => cb(null, mockStream))
        const callbackStub = sinon.stub()

        const p = sshInstance.connect({args: ['echo', 'hi']}, 'addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123', callbackStub)
        setImmediate(() => {
          capturedClient.emit('ready')
          setImmediate(() => mockStream.emit('close'))
        })

        await p
        expect(callbackStub.calledOnce).to.be.true
      })

      it('ends the connection when the exec stream closes', async function () {
        const mockStream = makeStream()
        clientExecStub.callsFake((_cmd: string, _opts: {pty: boolean}, cb: (err: Error | null, stream: ReturnType<typeof makeStream>) => void) => cb(null, mockStream))

        const p = sshInstance.connect({args: ['echo', 'hi']}, 'addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
        setImmediate(() => {
          capturedClient.emit('ready')
          setImmediate(() => mockStream.emit('close'))
        })

        await p
        expect(clientEndStub.calledOnce).to.be.true
      })
    })

    describe('connection config', function () {
      it('connects on port 80 with sha256 host hash and keepalive settings', async function () {
        const mockStream = makeStream()
        clientShellStub.callsFake((cb: (err: Error | null, stream: ReturnType<typeof makeStream>) => void) => cb(null, mockStream))

        const p = sshInstance.connect({args: []}, 'addon.host', 'testuser', Buffer.from('supersecretkey'), 'ssh-rsa abc123')
        setImmediate(() => {
          capturedClient.emit('ready')
          setImmediate(() => mockStream.emit('close'))
        })

        await p
        const config = clientConnectStub.firstCall.args[0]
        expect(config.port).to.equal(80)
        expect(config.hostHash).to.equal('sha256')
        expect(config.host).to.equal('addon.host')
        expect(config.username).to.equal('testuser')
        expect(config.keepaliveInterval).to.equal(10000)
        expect(config.keepaliveCountMax).to.equal(3)
      })
    })

    describe('error handling', function () {
      it('rejects the promise on connection error', async function () {
        const connErr = new Error('Connection refused')
        const p = sshInstance.connect({args: []}, 'addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
        setImmediate(() => capturedClient.emit('error', connErr))

        try {
          await p
          expect.fail('should have rejected')
        } catch (error) {
          expect(error).to.equal(connErr)
        }
      })

      it('shows keepalive timeout message on timeout error', async function () {
        const connErr = new Error('Keepalive timeout')
        const p = sshInstance.connect({args: []}, 'addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
        setImmediate(() => capturedClient.emit('error', connErr))

        try {
          await p
        } catch {
          // expected
        }

        expect(uxErrorStub.calledWith('Connection to the dyno timed out!')).to.be.true
      })

      it('shows a generic message for non-keepalive errors', async function () {
        const connErr = new Error('Network unreachable')
        const p = sshInstance.connect({args: []}, 'addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
        setImmediate(() => capturedClient.emit('error', connErr))

        try {
          await p
        } catch {
          // expected
        }

        expect(uxErrorStub.calledWith('There was an error connecting to the dyno!')).to.be.true
      })
    })
  })

  describe('ssh() native', function () {
    let childExecSyncStub: sinon.SinonStub

    beforeEach(function () {
      childExecSyncStub = sinon.stub(child, 'execSync')
    })

    it('includes host, user, port in the ssh command', async function () {
      await sshInstance.ssh({args: []}, 'addon.host', 'testuser', Buffer.from('key'), 'ssh-rsa abc123')

      const cmd = childExecSyncStub.firstCall.args[0] as string
      expect(cmd).to.include('testuser@addon.host')
      expect(cmd).to.include('-p 80')
      expect(cmd).to.include('-o ServerAliveInterval=10')
      expect(cmd).to.include('-o ServerAliveCountMax=3')
    })

    it('appends the built command when args do not include "bash"', async function () {
      await sshInstance.ssh({args: ['rake', 'test']}, 'addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')

      const cmd = childExecSyncStub.firstCall.args[0] as string
      expect(cmd).to.include('rake test')
    })

    it('does not append a sub-command when args include "bash"', async function () {
      await sshInstance.ssh({args: ['bash']}, 'addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')

      const cmd = childExecSyncStub.firstCall.args[0] as string
      const afterHost = cmd.split('user@addon.host')[1].trim()
      expect(afterHost).to.equal('')
    })

    it('does not append a sub-command when no args are provided', async function () {
      await sshInstance.ssh({args: []}, 'addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')

      const cmd = childExecSyncStub.firstCall.args[0] as string
      const afterHost = cmd.split('user@addon.host')[1].trim()
      expect(afterHost).to.equal('')
    })

    it('does not throw when execSync succeeds', async function () {
      await sshInstance.ssh({args: []}, 'addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')

      expect(childExecSyncStub.calledOnce).to.be.true
    })

    it('does not throw when execSync fails', async function () {
      childExecSyncStub.throws(new Error('ssh failed'))

      // Should not throw - errors are caught and logged
      await sshInstance.ssh({args: []}, 'addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')

      expect(childExecSyncStub.calledOnce).to.be.true
    })
  })

  describe('scp()', function () {
    it('opens an sftp session, calls fastGet with src/dest, and resolves', async function () {
      const mockSftp = {
        fastGet: sinon.stub().callsFake((_src: string, _dest: string, _opts: Record<string, unknown>, cb: (err: Error | null) => void) => cb(null)),
      }
      clientSftpStub.callsFake((cb: (err: Error | null, sftp?: Record<string, sinon.SinonStub>) => void) => cb(null, mockSftp))

      const p = sshInstance.scp('addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123', '/remote/file.txt', '/local/file.txt')
      setImmediate(() => capturedClient.emit('ready'))

      await p
      expect(mockSftp.fastGet.calledOnce).to.be.true
      expect(mockSftp.fastGet.firstCall.args[0]).to.equal('/remote/file.txt')
      expect(mockSftp.fastGet.firstCall.args[1]).to.equal('/local/file.txt')
      expect(clientEndStub.calledOnce).to.be.true
    })

    it('calls ux.error when the file transfer fails', async function () {
      const mockSftp = {
        fastGet: sinon.stub().callsFake((_src: string, _dest: string, _opts: Record<string, unknown>, cb: (err: Error | null) => void) => cb(new Error('transfer failed'))),
      }
      clientSftpStub.callsFake((cb: (err: Error | null, sftp?: Record<string, sinon.SinonStub>) => void) => cb(null, mockSftp))

      const p = sshInstance.scp('addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123', '/remote/file.txt', '/local/file.txt')
      setImmediate(() => capturedClient.emit('ready'))

      await p
      expect(uxErrorStub.calledOnce).to.be.true
    })

    it('calls ux.error when the sftp session cannot be opened', async function () {
      clientSftpStub.callsFake((cb: (err: Error | null, sftp?: Record<string, sinon.SinonStub>) => void) => cb(new Error('sftp unavailable')))

      sshInstance.scp('addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123', '/remote/file.txt', '/local/file.txt')
      setImmediate(() => capturedClient.emit('ready'))

      await new Promise<void>(resolve => {
        setImmediate(resolve)
      })
      expect(uxErrorStub.calledOnce).to.be.true
    })

    it('rejects on connection error', async function () {
      const connErr = new Error('Connection failed')
      const p = sshInstance.scp('addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123', '/remote/file.txt', '/local/file.txt')
      setImmediate(() => capturedClient.emit('error', connErr))

      try {
        await p
        expect.fail('should have rejected')
      } catch (error) {
        expect(error).to.equal(connErr)
      }
    })

    it('ends the connection even when the file transfer fails', async function () {
      const mockSftp = {
        fastGet: sinon.stub().callsFake((_src: string, _dest: string, _opts: Record<string, unknown>, cb: (err: Error | null) => void) => cb(new Error('transfer failed'))),
      }
      clientSftpStub.callsFake((cb: (err: Error | null, sftp?: Record<string, sinon.SinonStub>) => void) => cb(null, mockSftp))

      const p = sshInstance.scp('addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123', '/remote/file.txt', '/local/file.txt')
      setImmediate(() => capturedClient.emit('ready'))

      await p
      expect(clientEndStub.calledOnce).to.be.true
    })

    it('connects with the correct SSH config', async function () {
      const mockSftp = {
        fastGet: sinon.stub().callsFake((_src: string, _dest: string, _opts: Record<string, unknown>, cb: (err: Error | null) => void) => cb(null)),
      }
      clientSftpStub.callsFake((cb: (err: Error | null, sftp?: Record<string, sinon.SinonStub>) => void) => cb(null, mockSftp))

      const p = sshInstance.scp('addon.host', 'testuser', Buffer.from('supersecretkey'), 'ssh-rsa abc123', '/remote/file.txt', '/local/file.txt')
      setImmediate(() => capturedClient.emit('ready'))

      await p
      const config = clientConnectStub.firstCall.args[0]
      expect(config.host).to.equal('addon.host')
      expect(config.username).to.equal('testuser')
      expect(config.port).to.equal(80)
      expect(config.hostHash).to.equal('sha256')
    })

    it('initializes, starts, and updates the progress bar on step callbacks', async function () {
      const barStub = {start: sinon.stub(), update: sinon.stub(), stop: sinon.stub()}
      sinon.stub(cliProgress, 'SingleBar').returns(barStub as any)

      const mockSftp = {
        fastGet: sinon.stub().callsFake((_src: string, _dest: string, opts: {step: (t: number, c: number, total: number) => void}, cb: (err: Error | null) => void) => {
          opts.step(500, 100, 1000)
          opts.step(1000, 100, 1000)
          cb(null)
        }),
      }
      clientSftpStub.callsFake((cb: (err: Error | null, sftp?: typeof mockSftp) => void) => cb(null, mockSftp))

      const p = sshInstance.scp('addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123', '/remote/file.txt', '/local/file.txt')
      setImmediate(() => capturedClient.emit('ready'))

      await p
      expect((cliProgress.SingleBar as unknown as sinon.SinonStub).calledOnce).to.be.true
      expect(barStub.start.calledWith(1000, 0)).to.be.true
      expect(barStub.update.calledWith(500)).to.be.true
      expect(barStub.update.calledWith(1000)).to.be.true
    })

    it('stops the progress bar after a successful transfer', async function () {
      const barStub = {start: sinon.stub(), update: sinon.stub(), stop: sinon.stub()}
      sinon.stub(cliProgress, 'SingleBar').returns(barStub as any)

      const mockSftp = {
        fastGet: sinon.stub().callsFake((_src: string, _dest: string, opts: {step: (t: number, c: number, total: number) => void}, cb: (err: Error | null) => void) => {
          opts.step(1000, 100, 1000)
          cb(null)
        }),
      }
      clientSftpStub.callsFake((cb: (err: Error | null, sftp?: typeof mockSftp) => void) => cb(null, mockSftp))

      const p = sshInstance.scp('addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123', '/remote/file.txt', '/local/file.txt')
      setImmediate(() => capturedClient.emit('ready'))

      await p
      expect(barStub.stop.calledOnce).to.be.true
    })

    it('stops the progress bar after a failed transfer', async function () {
      const barStub = {start: sinon.stub(), update: sinon.stub(), stop: sinon.stub()}
      sinon.stub(cliProgress, 'SingleBar').returns(barStub as any)

      const mockSftp = {
        fastGet: sinon.stub().callsFake((_src: string, _dest: string, opts: {step: (t: number, c: number, total: number) => void}, cb: (err: Error | null) => void) => {
          opts.step(500, 100, 1000)
          cb(new Error('transfer failed'))
        }),
      }
      clientSftpStub.callsFake((cb: (err: Error | null, sftp?: typeof mockSftp) => void) => cb(null, mockSftp))

      const p = sshInstance.scp('addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123', '/remote/file.txt', '/local/file.txt')
      setImmediate(() => capturedClient.emit('ready'))

      await p
      expect(barStub.stop.calledOnce).to.be.true
    })

    it('does not stop the progress bar when no step callbacks fired', async function () {
      const barStub = {start: sinon.stub(), update: sinon.stub(), stop: sinon.stub()}
      sinon.stub(cliProgress, 'SingleBar').returns(barStub as any)

      const mockSftp = {
        fastGet: sinon.stub().callsFake((_src: string, _dest: string, _opts: Record<string, unknown>, cb: (err: Error | null) => void) => cb(null)),
      }
      clientSftpStub.callsFake((cb: (err: Error | null, sftp?: typeof mockSftp) => void) => cb(null, mockSftp))

      const p = sshInstance.scp('addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123', '/remote/file.txt', '/local/file.txt')
      setImmediate(() => capturedClient.emit('ready'))

      await p
      expect(barStub.stop.called).to.be.false
    })
  })

  describe('socksv5()', function () {
    let mockServer: {listen: sinon.SinonStub; useAuth: sinon.SinonStub}
    let createServerStub: sinon.SinonStub
    let capturedSocksHandler: (info: {srcAddr: string; srcPort: number; dstAddr: string; dstPort: number}, accept: (autoAccept?: boolean) => ReturnType<typeof makeStream> | null, deny: () => void) => void
    let clientForwardOutStub: sinon.SinonStub

    beforeEach(function () {
      mockServer = {
        listen: sinon.stub().callsFake((_port: number, _host: string, cb: () => void) => {
          cb()
          return mockServer
        }),
        useAuth: sinon.stub().returns(mockServer),
      }
      createServerStub = sinon.stub(socks, 'createServer').callsFake(((handler: typeof capturedSocksHandler) => {
        capturedSocksHandler = handler
        return mockServer
      }) as any)
      clientForwardOutStub = sinon.stub(Client.prototype, 'forwardOut')
    })

    it('starts the SOCKSv5 proxy on port 1080 and invokes the callback', function (done) {
      sshInstance.socksv5('addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123', (port: number) => {
        expect(port).to.equal(1080)
        expect(mockServer.listen.calledWith(1080, '127.0.0.1')).to.be.true
        done()
      })
    })

    it('works without a callback', function () {
      expect(() => {
        sshInstance.socksv5('addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
      }).not.to.throw()
      expect(createServerStub.calledOnce).to.be.true
    })

    it('calls useAuth on the server', function () {
      sshInstance.socksv5('addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
      expect(mockServer.useAuth.calledOnce).to.be.true
    })

    it('calls forwardOut with the SOCKS request info on ready', function () {
      const info = {srcAddr: '127.0.0.1', srcPort: 1234, dstAddr: 'example.com', dstPort: 80}
      const fwdStream = makeStream()
      clientForwardOutStub.callsFake((_sa: string, _sp: number, _da: string, _dp: number, cb: (err: Error | null, s: ReturnType<typeof makeStream>) => void) => cb(null, fwdStream))

      sshInstance.socksv5('addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
      capturedSocksHandler(info, sinon.stub().returns(makeStream()), sinon.stub())
      capturedClient.emit('ready')

      expect(clientForwardOutStub.calledOnce).to.be.true
      const [srcAddr, srcPort, dstAddr, dstPort] = clientForwardOutStub.firstCall.args
      expect(srcAddr).to.equal('127.0.0.1')
      expect(srcPort).to.equal(1234)
      expect(dstAddr).to.equal('example.com')
      expect(dstPort).to.equal(80)
    })

    it('denies and ends the connection when forwardOut errors', function () {
      const info = {srcAddr: '127.0.0.1', srcPort: 1234, dstAddr: 'example.com', dstPort: 80}
      const deny = sinon.stub()
      clientForwardOutStub.callsFake((_sa: string, _sp: number, _da: string, _dp: number, cb: (err: Error | null, s: null) => void) => cb(new Error('forward failed'), null))

      sshInstance.socksv5('addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
      capturedSocksHandler(info, sinon.stub(), deny)
      capturedClient.emit('ready')

      expect(deny.calledOnce).to.be.true
      expect(clientEndStub.calledOnce).to.be.true
    })

    it('pipes the forwarded stream to the accepted client socket', function () {
      const info = {srcAddr: '127.0.0.1', srcPort: 1234, dstAddr: 'example.com', dstPort: 80}
      const fwdStream = makeStream()
      const clientSocket = makeStream()
      clientForwardOutStub.callsFake((_sa: string, _sp: number, _da: string, _dp: number, cb: (err: Error | null, s: ReturnType<typeof makeStream>) => void) => cb(null, fwdStream))

      sshInstance.socksv5('addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
      capturedSocksHandler(info, sinon.stub().returns(clientSocket), sinon.stub())
      capturedClient.emit('ready')

      expect(fwdStream.pipe.calledWith(clientSocket)).to.be.true
    })

    it('ends the connection when the piped stream closes', function () {
      const info = {srcAddr: '127.0.0.1', srcPort: 1234, dstAddr: 'example.com', dstPort: 80}
      const fwdStream = makeStream()
      clientForwardOutStub.callsFake((_sa: string, _sp: number, _da: string, _dp: number, cb: (err: Error | null, s: ReturnType<typeof makeStream>) => void) => cb(null, fwdStream))

      sshInstance.socksv5('addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
      capturedSocksHandler(info, sinon.stub().returns(makeStream()), sinon.stub())
      capturedClient.emit('ready')
      fwdStream.emit('close')

      expect(clientEndStub.calledOnce).to.be.true
    })

    it('ends the connection immediately when accept returns null', function () {
      const info = {srcAddr: '127.0.0.1', srcPort: 1234, dstAddr: 'example.com', dstPort: 80}
      const fwdStream = makeStream()
      clientForwardOutStub.callsFake((_sa: string, _sp: number, _da: string, _dp: number, cb: (err: Error | null, s: ReturnType<typeof makeStream>) => void) => cb(null, fwdStream))

      sshInstance.socksv5('addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
      capturedSocksHandler(info, sinon.stub().returns(null), sinon.stub())
      capturedClient.emit('ready')

      expect(clientEndStub.calledOnce).to.be.true
    })

    it('denies the request on SSH client error', function () {
      const info = {srcAddr: '127.0.0.1', srcPort: 1234, dstAddr: 'example.com', dstPort: 80}
      const deny = sinon.stub()

      sshInstance.socksv5('addon.host', 'user', Buffer.from('key'), 'ssh-rsa abc123')
      capturedSocksHandler(info, sinon.stub(), deny)
      capturedClient.emit('error', new Error('connection failed'))

      expect(deny.calledOnce).to.be.true
    })

    it('connects with the correct SSH config for each SOCKS request', function () {
      const info = {srcAddr: '127.0.0.1', srcPort: 1234, dstAddr: 'example.com', dstPort: 80}
      clientForwardOutStub.callsFake((_sa: string, _sp: number, _da: string, _dp: number, cb: (err: Error | null, s: ReturnType<typeof makeStream>) => void) => cb(null, makeStream()))

      sshInstance.socksv5('addon.host', 'testuser', Buffer.from('supersecretkey'), 'ssh-rsa abc123')
      capturedSocksHandler(info, sinon.stub().returns(makeStream()), sinon.stub())

      const config = clientConnectStub.firstCall.args[0]
      expect(config.host).to.equal('addon.host')
      expect(config.username).to.equal('testuser')
      expect(config.port).to.equal(80)
      expect(config.hostHash).to.equal('sha256')
    })
  })

  describe('_connectionDefaults() hostVerifier', function () {
    it('returns true for a matching key hash', async function () {
      const crypto = await import('node:crypto')
      const testKeyData = Buffer.from('test-key-bytes')
      const proxyKey = `ssh-rsa ${testKeyData.toString('base64')}`
      const expectedHash = crypto.createHash('sha256').update(testKeyData).digest('hex')

      const mockStream = makeStream()
      clientShellStub.callsFake((cb: (err: Error | null, stream: ReturnType<typeof makeStream>) => void) => cb(null, mockStream))

      const p = sshInstance.connect({args: []}, 'addon.host', 'user', Buffer.from('key'), proxyKey)
      setImmediate(() => {
        capturedClient.emit('ready')
        setImmediate(() => mockStream.emit('close'))
      })

      await p
      const {hostVerifier} = clientConnectStub.firstCall.args[0]
      expect(hostVerifier(expectedHash)).to.be.true
    })

    it('returns false for a non-matching key hash', async function () {
      const testKeyData = Buffer.from('test-key-bytes')
      const proxyKey = `ssh-rsa ${testKeyData.toString('base64')}`

      const mockStream = makeStream()
      clientShellStub.callsFake((cb: (err: Error | null, stream: ReturnType<typeof makeStream>) => void) => cb(null, mockStream))

      const p = sshInstance.connect({args: []}, 'addon.host', 'user', Buffer.from('key'), proxyKey)
      setImmediate(() => {
        capturedClient.emit('ready')
        setImmediate(() => mockStream.emit('close'))
      })

      await p
      const {hostVerifier} = clientConnectStub.firstCall.args[0]
      expect(hostVerifier('wrong-hash-value')).to.be.false
    })
  })
})
