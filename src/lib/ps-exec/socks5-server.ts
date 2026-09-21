// cspell:ignore atyp nmethods
import net from 'node:net'

/**
 * A minimal SOCKS5 server supporting only the CONNECT command with no
 * authentication — the exact subset the `heroku ps:socks`/`ps:forward`
 * commands require.
 *
 * Unlike a general SOCKS proxy, this server never dials the destination
 * itself: the destination lives inside the dyno's private network and is only
 * reachable through an SSH tunnel. Instead, the connection handler receives the
 * parsed request and an `accept(true)` callback that hands back the raw client
 * socket, so the caller can pipe it to an SSH `forwardOut` stream.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc1928
 */

export interface SocksRequestInfo {
  cmd: number
  dstAddr: string
  dstPort: number
  srcAddr: string
  srcPort: number
}

/**
 * Approves the connection. Only intercept mode (`accept(true)`) is supported:
 * it sends the SOCKS success reply and returns the raw client socket for the
 * caller to bridge to its own upstream. Returns `null` if the socket is no
 * longer writable.
 */
export type AcceptFn = (intercept?: boolean) => net.Socket | null
export type DenyFn = () => void
export type ConnectionHandler = (info: SocksRequestInfo, accept: AcceptFn, deny: DenyFn) => void

const SOCKS_VERSION = 0x05
const AUTH_NONE = 0x00
const AUTH_NO_ACCEPTABLE = 0xFF
const CMD_CONNECT = 0x01
const ATYP_IPV4 = 0x01
const ATYP_DOMAIN = 0x03
const ATYP_IPV6 = 0x04
const REP_SUCCESS = 0x00
const REP_GENERAL_FAILURE = 0x01
const REP_CMD_NOT_SUPPORTED = 0x07

// Replies carry a null bind address (0.0.0.0:0); clients doing CONNECT ignore it.
const reply = (rep: number) => Buffer.from([SOCKS_VERSION, rep, 0x00, ATYP_IPV4, 0, 0, 0, 0, 0, 0])

export class Socks5Server {
  readonly server: net.Server

  constructor(private readonly handler: ConnectionHandler) {
    this.server = net.createServer(socket => this._handleConnection(socket))
  }

  close(callback?: () => void): this {
    this.server.close(callback)
    return this
  }

  listen(port: number, host: string, callback?: () => void): this {
    this.server.listen(port, host, callback)
    return this
  }

  private _handleConnection(socket: net.Socket): void {
    socket.on('error', () => socket.destroy())

    let buffer = Buffer.alloc(0)
    const onData = (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk])
      pump()
    }

    // Sequential reader over the accumulating buffer. Each step consumes a fixed
    // number of bytes once they are available and advances to the next.
    const steps: Array<{need: number; run: (b: Buffer) => void}> = []
    const readBytes = (need: number, run: (b: Buffer) => void) => steps.push({need, run})
    const pump = () => {
      while (steps.length > 0 && buffer.length >= steps[0].need) {
        const {need, run} = steps.shift()!
        const bytes = buffer.subarray(0, need)
        buffer = buffer.subarray(need)
        run(bytes)
      }
    }

    // Greeting: VER, NMETHODS, METHODS...
    readBytes(2, header => {
      if (header[0] !== SOCKS_VERSION) return socket.destroy()
      readBytes(header[1], methods => {
        if (!methods.includes(AUTH_NONE)) {
          socket.end(Buffer.from([SOCKS_VERSION, AUTH_NO_ACCEPTABLE]))
          return
        }

        socket.write(Buffer.from([SOCKS_VERSION, AUTH_NONE]))

        // Request: VER, CMD, RSV, ATYP, DST.ADDR, DST.PORT
        readBytes(4, head => {
          const [ver, cmd, , atyp] = head
          if (ver !== SOCKS_VERSION) return socket.destroy()

          this._readAddress(atyp, readBytes, addr => {
            if (addr === null) {
              socket.end(reply(REP_GENERAL_FAILURE))
              return
            }

            readBytes(2, portBuf => {
              const dstPort = portBuf.readUInt16BE(0)
              if (cmd !== CMD_CONNECT) {
                socket.end(reply(REP_CMD_NOT_SUPPORTED))
                return
              }

              const info: SocksRequestInfo = {
                cmd,
                dstAddr: addr,
                dstPort,
                srcAddr: socket.remoteAddress ?? '',
                srcPort: socket.remotePort ?? 0,
              }

              const accept: AcceptFn = () => {
                if (!socket.writable) return null
                socket.write(reply(REP_SUCCESS))
                // Stop intercepting: detach our reader and hand back any bytes
                // that arrived after the request so piping sees a clean stream.
                socket.removeListener('data', onData)
                if (buffer.length > 0) {
                  socket.unshift(buffer)
                  buffer = Buffer.alloc(0)
                }

                return socket
              }

              const deny: DenyFn = () => {
                socket.end(reply(REP_GENERAL_FAILURE))
              }

              this.handler(info, accept, deny)
            })
          })
        })
      })
    })

    socket.on('data', onData)
  }

  // DST.ADDR is length-prefixed for domains and fixed-width for IPs. Calls back
  // with the decoded address, or null on an unsupported address type.
  private _readAddress(atyp: number, readBytes: (need: number, run: (b: Buffer) => void) => void, done: (addr: null | string) => void): void {
    switch (atyp) {
      case ATYP_DOMAIN: {
        readBytes(1, lenBuf => readBytes(lenBuf[0], nameBuf => done(nameBuf.toString('utf8'))))
        break
      }

      case ATYP_IPV4: {
        readBytes(4, b => done(`${b[0]}.${b[1]}.${b[2]}.${b[3]}`))
        break
      }

      case ATYP_IPV6: {
        readBytes(16, b => {
          const groups: string[] = []
          for (let i = 0; i < 16; i += 2) groups.push(b.readUInt16BE(i).toString(16))
          done(groups.join(':'))
        })
        break
      }

      default: {
        done(null)
      }
    }
  }
}

function createServer(handler: ConnectionHandler): Socks5Server {
  return new Socks5Server(handler)
}

export default {createServer}
