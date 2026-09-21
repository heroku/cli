// cspell:ignore atyp
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
    const clientSocket = accept(true)
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
})
