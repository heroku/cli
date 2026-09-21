// cspell:ignore atyp gssapi
import {expect} from 'chai'
import net, {AddressInfo} from 'node:net'

import {Socks5Server} from '../../../../src/lib/ps-exec/socks5-server.js'

const port16 = (port: number): Buffer => {
  const b = Buffer.alloc(2)
  b.writeUInt16BE(port)
  return b
}

const ipv4Request = (cmd: number, host: string, port: number): Buffer =>
  Buffer.concat([Buffer.from([0x05, cmd, 0x00, 0x01, ...host.split('.').map(Number)]), port16(port)])

const domainRequest = (cmd: number, host: string, port: number): Buffer => {
  const name = Buffer.from(host, 'utf8')
  return Buffer.concat([Buffer.from([0x05, cmd, 0x00, 0x03, name.length]), name, port16(port)])
}

const ipv6Request = (cmd: number, groups: number[], port: number): Buffer => {
  const addr = Buffer.alloc(16)
  for (const [i, group] of groups.entries()) addr.writeUInt16BE(group, i * 2)
  return Buffer.concat([Buffer.from([0x05, cmd, 0x00, 0x04]), addr, port16(port)])
}

// Exercises the hand-rolled SOCKS5 server end-to-end over real loopback sockets
// using a minimal raw SOCKS5 client (below), so the assertions are on the actual
// protocol bytes the server emits. We deliberately avoid the `socks` npm client
// here: the test harness (test/helpers/init.mjs) collapses setTimeout delays to
// zero, which trips that client's establishment timeout. The server itself uses
// no timers, so a raw client is both sufficient and more precise.
describe('Socks5Server', function () {
  let upstream: net.Server
  let upstreamPort: number
  let proxy: Socks5Server
  let proxyPort: number

  const listen = (server: net.Server): Promise<number> =>
    new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve((server.address() as AddressInfo).port)))

  beforeEach(async function () {
    // Echo upstream: whatever it receives, it writes back.
    upstream = net.createServer(sock => sock.pipe(sock))
    upstreamPort = await listen(upstream)
  })

  afterEach(function () {
    if (proxy) proxy.close()
    if (upstream) upstream.close()
  })

  async function startProxy(handler: ConstructorParameters<typeof Socks5Server>[0]): Promise<void> {
    proxy = new Socks5Server(handler)
    proxyPort = await new Promise(resolve =>
      proxy.listen(0, '127.0.0.1', () => resolve((proxy.server.address() as AddressInfo).port)))
  }

  // Handler that accepts and bridges the client socket to the echo upstream —
  // the same shape as ssh.ts bridging to an SSH forwardOut stream.
  const bridgeToUpstream: ConstructorParameters<typeof Socks5Server>[0] = (_info, accept) => {
    const clientSocket = accept()
    if (!clientSocket) return
    const up = net.connect(upstreamPort, '127.0.0.1')
    // Swallow resets that occur when a test tears down mid-flight (destroy() +
    // server close). Without handlers these surface as uncaught exceptions.
    clientSocket.on('error', () => {})
    up.on('error', () => {})
    clientSocket.pipe(up).pipe(clientSocket)
  }

  // Minimal SOCKS5 client: sends the no-auth greeting, then `request`, and
  // resolves with the server's method-selection reply, the 10-byte CONNECT
  // reply (server always answers with an IPv4-form bind address), and the open
  // socket for any follow-on data.
  function rawConnect(port: number, request: Buffer): Promise<{connectReply: Buffer; methodReply: Buffer; socket: net.Socket}> {
    return new Promise((resolve, reject) => {
      const socket = net.connect(port, '127.0.0.1')
      let buf = Buffer.alloc(0)
      let methodReply: Buffer | undefined
      socket.on('error', reject)
      socket.on('connect', () => socket.write(Buffer.from([0x05, 0x01, 0x00])))
      socket.on('data', chunk => {
        buf = Buffer.concat([buf, chunk])
        if (!methodReply) {
          if (buf.length < 2) return
          methodReply = buf.subarray(0, 2)
          buf = buf.subarray(2)
          socket.write(request)
        }

        if (methodReply && buf.length >= 10) {
          resolve({connectReply: buf.subarray(0, 10), methodReply, socket})
        }
      })
    })
  }

  it('negotiates no-auth and bridges bytes both ways on CONNECT (IPv4 dest)', async function () {
    await startProxy(bridgeToUpstream)

    const {connectReply, methodReply, socket} = await rawConnect(proxyPort, ipv4Request(0x01, '127.0.0.1', upstreamPort))
    expect([...methodReply]).to.deep.equal([0x05, 0x00])
    expect(connectReply[1]).to.equal(0x00) // REP = success

    const echoed = await new Promise<string>((resolve, reject) => {
      socket.on('data', d => resolve(d.toString()))
      socket.on('error', reject)
      socket.write('ping')
    })
    socket.destroy()

    expect(echoed).to.equal('ping')
  })

  it('decodes a domain-name destination (ATYP 0x03) and passes it to the handler', async function () {
    let seen: undefined | {dstAddr: string; dstPort: number}
    await startProxy((info, accept) => {
      seen = {dstAddr: info.dstAddr, dstPort: info.dstPort}
      bridgeToUpstream(info, accept, () => {})
    })

    const {connectReply, socket} = await rawConnect(proxyPort, domainRequest(0x01, 'localhost', upstreamPort))
    socket.destroy()

    expect(connectReply[1]).to.equal(0x00)
    expect(seen).to.deep.equal({dstAddr: 'localhost', dstPort: upstreamPort})
  })

  it('replies with a general failure (REP 0x01) when the handler denies', async function () {
    await startProxy((_info, _accept, deny) => deny())

    const {connectReply, socket} = await rawConnect(proxyPort, ipv4Request(0x01, '127.0.0.1', upstreamPort))
    socket.destroy()

    expect(connectReply[1]).to.equal(0x01)
  })

  it('rejects an unsupported command (BIND) with REP 0x07 and never calls the handler', async function () {
    let handlerCalled = false
    await startProxy(() => {
      handlerCalled = true
    })

    const {connectReply, socket} = await rawConnect(proxyPort, ipv4Request(0x02, '127.0.0.1', upstreamPort))
    socket.destroy()

    expect(connectReply[1]).to.equal(0x07) // command not supported
    expect(handlerCalled).to.be.false
  })

  it('decodes an IPv6 destination (ATYP 0x04) and passes it to the handler', async function () {
    let seen: string | undefined
    await startProxy((info, accept) => {
      seen = info.dstAddr
      bridgeToUpstream(info, accept, () => {})
    })

    const {connectReply, socket} = await rawConnect(proxyPort, ipv6Request(0x01, [0, 0, 0, 0, 0, 0, 0, 1], upstreamPort))
    socket.destroy()

    expect(connectReply[1]).to.equal(0x00)
    expect(seen).to.equal('0:0:0:0:0:0:0:1')
  })

  it('destroys the connection on an unsupported SOCKS version (no reply)', async function () {
    await startProxy(bridgeToUpstream)

    const got = await new Promise<Buffer>((resolve, reject) => {
      const socket = net.connect(proxyPort, '127.0.0.1')
      let buf = Buffer.alloc(0)
      socket.on('error', reject)
      socket.on('connect', () => socket.write(Buffer.from([0x04, 0x01, 0x00]))) // VER 4
      socket.on('data', d => {
        buf = Buffer.concat([buf, d])
      })
      socket.on('close', () => resolve(buf))
    })

    expect(got.length).to.equal(0) // server destroyed the socket without replying
  })

  it('rejects the greeting when no acceptable auth method is offered (REP 0xFF)', async function () {
    await startProxy(bridgeToUpstream)

    const reply = await new Promise<Buffer>((resolve, reject) => {
      const socket = net.connect(proxyPort, '127.0.0.1')
      socket.on('error', reject)
      socket.on('connect', () => socket.write(Buffer.from([0x05, 0x01, 0x02]))) // only GSSAPI (0x02)
      socket.on('data', d => resolve(d.subarray(0, 2)))
    })

    expect([...reply]).to.deep.equal([0x05, 0xFF])
  })

  it('assembles a handshake whose request is split across TCP segments', async function () {
    await startProxy(bridgeToUpstream)
    const request = ipv4Request(0x01, '127.0.0.1', upstreamPort)

    const echoed = await new Promise<string>((resolve, reject) => {
      const socket = net.connect(proxyPort, '127.0.0.1')
      socket.setNoDelay(true)
      let buf = Buffer.alloc(0)
      // phases: 'greeting' -> 'reply' (awaiting 10-byte CONNECT reply) -> 'echo'
      let phase: 'echo' | 'greeting' | 'reply' = 'greeting'
      socket.on('error', reject)
      socket.on('connect', () => socket.write(Buffer.from([0x05, 0x01, 0x00])))
      socket.on('data', chunk => {
        buf = Buffer.concat([buf, chunk])
        if (phase === 'greeting' && buf.length >= 2) {
          buf = buf.subarray(2) // consume method-selection reply
          phase = 'reply'
          // Deliver the request in two pieces to exercise the partial-buffer path.
          socket.write(request.subarray(0, 3))
          setImmediate(() => socket.write(request.subarray(3)))
        }

        if (phase === 'reply' && buf.length >= 10) {
          buf = buf.subarray(10) // consume CONNECT reply
          phase = 'echo'
          socket.write('ping')
        }

        if (phase === 'echo' && buf.toString() === 'ping') {
          socket.destroy()
          resolve('ping')
        }
      })
    })

    expect(echoed).to.equal('ping')
  })

  it('replays application bytes pipelined immediately after the CONNECT request', async function () {
    await startProxy(bridgeToUpstream)

    const tail = await new Promise<string>((resolve, reject) => {
      const socket = net.connect(proxyPort, '127.0.0.1')
      let buf = Buffer.alloc(0)
      let methodReply: Buffer | undefined
      socket.on('error', reject)
      socket.on('connect', () => socket.write(Buffer.from([0x05, 0x01, 0x00])))
      socket.on('data', chunk => {
        buf = Buffer.concat([buf, chunk])
        if (!methodReply) {
          if (buf.length < 2) return
          methodReply = buf.subarray(0, 2)
          buf = buf.subarray(2)
          // Pipeline 'ping' in the same write as the request, before the reply.
          socket.write(Buffer.concat([ipv4Request(0x01, '127.0.0.1', upstreamPort), Buffer.from('ping')]))
        }

        // 10-byte CONNECT reply, then the echoed pipelined bytes.
        if (methodReply && buf.length >= 14) {
          socket.destroy()
          resolve(buf.subarray(10, 14).toString())
        }
      })
    })

    expect(tail).to.equal('ping')
  })

  it('returns null from a second accept() call (idempotent)', async function () {
    let secondResult: unknown = 'unset'
    await startProxy((info, accept) => {
      const first = accept()
      secondResult = accept()
      if (!first) return
      const up = net.connect(upstreamPort, '127.0.0.1')
      first.on('error', () => {})
      up.on('error', () => {})
      first.pipe(up).pipe(first)
    })

    const {connectReply, socket} = await rawConnect(proxyPort, ipv4Request(0x01, '127.0.0.1', upstreamPort))
    socket.destroy()

    expect(connectReply[1]).to.equal(0x00)
    expect(secondResult).to.equal(null)
  })

  it('surfaces a bind failure through the on(error) passthrough', async function () {
    // First server claims a port; a second server binding the same port must
    // emit 'error' through the wrapper rather than throwing unhandled.
    const first = new Socks5Server(() => {})
    const takenPort: number = await new Promise(resolve =>
      first.listen(0, '127.0.0.1', () => resolve((first.server.address() as AddressInfo).port)))

    try {
      const second = new Socks5Server(() => {})
      const err = await new Promise<NodeJS.ErrnoException>(resolve => {
        second.on('error', resolve).listen(takenPort, '127.0.0.1')
      })
      expect(err.code).to.equal('EADDRINUSE')
    } finally {
      first.close()
    }
  })

  it('ignores a deny() issued after accept() so the tunnel is not corrupted', async function () {
    await startProxy((info, accept, deny) => {
      const clientSocket = accept()
      deny() // must be a no-op: no failure reply injected into the live stream
      if (!clientSocket) return
      const up = net.connect(upstreamPort, '127.0.0.1')
      clientSocket.on('error', () => {})
      up.on('error', () => {})
      clientSocket.pipe(up).pipe(clientSocket)
    })

    const {connectReply, socket} = await rawConnect(proxyPort, ipv4Request(0x01, '127.0.0.1', upstreamPort))
    const echoed = await new Promise<string>((resolve, reject) => {
      socket.on('data', d => resolve(d.toString()))
      socket.on('error', reject)
      socket.write('ping')
    })
    socket.destroy()

    expect(connectReply[1]).to.equal(0x00)
    expect(echoed).to.equal('ping')
  })
})
