import * as color from '@heroku/heroku-cli-util/color'
import {Errors} from '@oclif/core'
import {ux} from '@oclif/core/ux'
import cliProgress from 'cli-progress'
import debug from 'debug'
import child from 'node:child_process'
import crypto from 'node:crypto'
import * as fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import stream from 'node:stream'
import tty from 'node:tty'
import {
  Client, type ClientChannel, ConnectConfig, type PseudoTtyOptions,
} from 'ssh2'

import socks5 from './socks5-server.js'

const sshDebug = debug('cli:ps-exec:ssh')

// Upper bound on simultaneously-live SOCKS connections (each is its own SSH
// session). Generous enough for a browser fanning out, low enough to keep a
// runaway local client from exhausting fds/SSH sessions.
const MAX_SOCKS_CONNECTIONS = 128

export class HerokuSsh {
  // True while the local stdin is in raw mode for an interactive session.
  private interactiveRawMode = false

  public connect(context: {args: string[]}, addonHost: string, dynoUser: string, privateKey: Buffer | string, proxyKey: string, callback?: (() => void)) {
    return new Promise<void>((resolve, reject) => {
      const conn = new Client()
      sshDebug('[cli-ssh] created')
      conn.on('ready', () => {
        sshDebug('[cli-ssh] ready')
        ux.action.stop('up')
        if (context.args.length > 0 && !context.args.includes('bash')) {
          const cmd = this._buildCommand(context.args)
          sshDebug(`[cli-ssh] command: ${cmd}`)
          conn.exec(cmd, {pty: this._ptyOptions()}, (err, stream) => {
            sshDebug('[cli-ssh] exec')
            if (err) {
              sshDebug(`[cli-ssh] err: ${err}`)
              throw err
            }

            this._prepareInteractiveSession(stream)
            stream.on('close', () => {
              sshDebug('[cli-ssh] close')
              conn.end()
              resolve()
              if (callback) callback()
            })
              .on('data', this._readData(stream))
              .stderr.on('data', (data: Buffer) => {
                process.stderr.write(data)
              })
            stream.on('error', reject)
            process.once('SIGINT', () => conn.end())
          })
        } else {
          sshDebug('[cli-ssh] bash')
          conn.shell(this._ptyOptions(), (err, stream) => {
            sshDebug('[cli-ssh] shell')
            if (err) {
              sshDebug(`[cli-ssh] err: ${err}`)
              return this._logConnectionError()
            }

            this._prepareInteractiveSession(stream)
            stream.on('close', () => {
              sshDebug('[cli-ssh] close')
              conn.end()
              resolve()
            })
              .on('data', this._readData(stream))
              .on('error', (error: Error) => {
                sshDebug(error)
                reject(error)
                ux.error('There was a networking error! Please try connecting again.')
              })
            process.once('SIGINT', () => conn.end())
          })
        }
      }).on('error', err => {
        sshDebug(err)
        reject(err)
        if (err.message === 'Keepalive timeout') {
          ux.error('Connection to the dyno timed out!')
        } else {
          ux.error('There was an error connecting to the dyno!')
        }
      })

      conn.connect({
        ...this._connectionDefaults(proxyKey),
        debug: sshDebug,
        host: addonHost,
        keepaliveCountMax: 3,
        keepaliveInterval: 10_000,
        privateKey,
        username: dynoUser,
      })
      // Keystrokes are single-byte writes. Without this, TCP holds each one
      // until an acknowledgement arrives, so typing through the port-80 proxy
      // lags by tens or hundreds of milliseconds. heroku run disables that
      // delay too, which is why a Rails console feels immediate.
      conn.setNoDelay(true)
    })
  }

  public scp(addonHost: string, dynoUser: string, privateKey: Buffer | string, proxyKey: string, src: string, dest: string) {
    return new Promise<void>((resolve, reject) => {
      const conn = new Client()
      conn.on('ready', () => {
        sshDebug('[scp] ready')
        ux.action.stop('up')
        conn.sftp((error, sftp) => {
          if (error) {
            return this._logConnectionError()
          }

          let bar: cliProgress.SingleBar | null = null
          const progressCallback = function (totalTransferred: number, _chunk: number, totalFile: number) {
            if (!bar) {
              bar = new cliProgress.SingleBar({
                barsize: 25,
                format: 'Downloading... [{bar}] {percentage}% ETA: {eta}s',
              })
              bar.start(totalFile, 0)
            }

            bar.update(totalTransferred)
          }

          sftp.fastGet(src, dest, {
            step(totalTransferred, chunk, totalFile) {
              progressCallback(totalTransferred, chunk, totalFile)
            },
          }, error => {
            if (bar) bar.stop()
            if (error) {
              sshDebug(error)
              ux.error('Could not transfer the file. Make sure the filename is correct.')
            }

            conn.end()
            resolve()
          })
        })
      }).on('error', err => {
        sshDebug('[scp] error:', err)
        reject(err)
      }).connect({
        ...this._connectionDefaults(proxyKey),
        debug: sshDebug,
        host: addonHost,
        privateKey,
        username: dynoUser,
      })
    })
  }

  public socksv5(addonHost: string, dynoUser: string, privateKey: Buffer | string, proxyKey: string, callback?: ((port: number) => void)) {
    const socksPort = 1080
    // Each accepted SOCKS request opens its own SSH connection, so cap how many
    // can be live at once. Without this a client that fans out many parallel
    // connections (a browser, or a hostile local process) can drive up fd/memory
    // and SSH-session load on both the CLI and the dyno's sshd.
    let activeConnections = 0
    socks5.createServer((info, accept, deny) => {
      if (activeConnections >= MAX_SOCKS_CONNECTIONS) {
        sshDebug(`refusing SOCKS request: ${activeConnections} connections already active (max ${MAX_SOCKS_CONNECTIONS})`)
        return deny()
      }

      activeConnections++
      const conn = new Client()
      let released = false
      // Free the slot exactly once, whenever this SSH connection closes.
      const release = () => {
        if (released) return
        released = true
        activeConnections--
      }

      conn.on('close', release)
      let clientSocket: ReturnType<typeof accept> = null
      const teardown = () => {
        if (clientSocket) clientSocket.destroy()
        conn.end()
      }

      conn.on('ready', () => {
        conn.forwardOut(
          info.srcAddr,
          info.srcPort,
          info.dstAddr,
          info.dstPort,
          (err, stream) => {
            if (err) {
              conn.end()
              return deny()
            }

            // Guard the forwardOut stream against an unhandled 'error' before the
            // accept() null-check below: if accept() returns null we abandon this
            // stream (conn.end() emits 'close', not 'error'), but a late error on
            // the orphaned stream would otherwise go unhandled and crash the CLI.
            stream.on('error', teardown)

            clientSocket = accept()
            if (!clientSocket) {
              conn.end()
              return
            }

            // Tear the tunnel down if either side errors, rather than letting an
            // unhandled 'error' event crash the CLI.
            clientSocket.on('error', teardown)
            stream.pipe(clientSocket).pipe(stream).on('close', () => {
              conn.end()
            })
          },
        )
      }).on('error', () => {
        // Before accept, reject the SOCKS request. After, the tunnel is live, so
        // tear it down instead of injecting a late SOCKS reply into the stream.
        if (clientSocket) teardown()
        else deny()
      }).connect({
        ...this._connectionDefaults(proxyKey),
        host: addonHost,
        privateKey,
        username: dynoUser,
      })
    }).on('error', (err: NodeJS.ErrnoException) => {
      this._reportProxyBindError(err, socksPort)
    }).listen(socksPort, '127.0.0.1', () => {
      ux.stdout(`SOCKSv5 proxy server started on port ${color.info(socksPort.toString())}`)
      if (callback) callback(socksPort)
    })
  }

  public async ssh(context: {args: string[]}, addonHost: string, dynoUser: string, privateKey: Buffer | string, proxyKey: string) {
    sshDebug('[cli-ssh] native')

    const tmpDir = os.tmpdir()
    const keyPath = path.join(tmpDir, `heroku-exec-key-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    const proxyKeyPath = path.join(tmpDir, `heroku-exec-proxy-key-${Date.now()}-${Math.random().toString(36).slice(2)}`)

    try {
      await fsp.writeFile(keyPath, Buffer.isBuffer(privateKey) ? privateKey : Buffer.from(privateKey), {mode: 0o600})
      await fsp.writeFile(proxyKeyPath, `[${addonHost}]:80 ${proxyKey}`, {mode: 0o600})

      // Same shape as heroku console / heroku run on Private Spaces: the ssh
      // process inherits the terminal, so keystrokes never pass through Node.
      // -tt allocates a remote terminal. -e none keeps a leading "~" from
      // being swallowed as an ssh escape.
      const args = [
        '-tt',
        '-e',
        'none',
        '-o',
        `UserKnownHostsFile=${proxyKeyPath}`,
        '-o',
        'ServerAliveInterval=10',
        '-o',
        'ServerAliveCountMax=3',
        '-p',
        '80',
        '-i',
        keyPath,
        `${dynoUser}@${addonHost}`,
      ]
      if (context.args.length > 0 && !context.args.includes('bash')) {
        args.push(this._buildCommand(context.args))
      }

      // Drop the "Connecting..." spinner before ssh draws on this terminal.
      ux.action.stop()
      await new Promise<void>((resolve, reject) => {
        let settled = false
        const proc = child.spawn('ssh', args, {stdio: 'inherit'})
        proc.once('error', (error: NodeJS.ErrnoException) => {
          if (settled) return
          settled = true
          sshDebug(error)
          reject(error)
        })
        proc.once('exit', (status: null | number) => {
          if (settled) return
          settled = true
          sshDebug(`[cli-ssh] exit: ${status}`)
          resolve()
        })
      })
    } finally {
      await fsp.unlink(keyPath).catch(() => {})
      await fsp.unlink(proxyKeyPath).catch(() => {})
    }
  }

  private _buildCommand(args: string[]) {
    if (args.length === 1) {
      // do not add quotes around arguments if there is only one argument
      // `heroku run "rake test"` should work like `heroku run rake test`
      return args[0]
    }

    let cmd = ''
    for (let arg of args) {
      if (arg.includes(' ') || arg.includes('"')) {
        arg = '"' + arg.replaceAll('"', String.raw`\"`) + '"'
      }

      cmd = cmd + ' ' + arg
    }

    return cmd.trim()
  }

  private _connectionDefaults(proxyKey: string): Partial<ConnectConfig> {
    return {
      hostHash: 'sha256',
      hostVerifier(hashedKey: string) {
        // proxyKey is the API-provided "ssh-rsa <base64>" host key. If it's
        // empty or missing the base64 blob, fail closed rather than throwing
        // out of the verifier on `Buffer.from(undefined, ...)`.
        const keyBlob = proxyKey?.split(' ')[1]
        if (!keyBlob) {
          sshDebug('proxy public key is missing or malformed; refusing host key')
          return false
        }

        const hasher = crypto.createHash('sha256')
        hasher.update(Buffer.from(keyBlob, 'base64'))
        return hasher.digest('hex') === hashedKey
      },
      port: 80,
      // Bound how long a connecting client is held before we give up, so a
      // stalled SSH endpoint can't pin a paused SOCKS client socket forever.
      readyTimeout: 20_000,
    }
  }

  private _logConnectionError() {
    ux.error(`Could not connect to the dyno. Check that the dyno is active by running ${color.command('heroku ps')}`)
  }

  private _prepareInteractiveSession(channel: ClientChannel) {
    const onResize = () => {
      const pty = this._ptyOptions()
      channel.setWindow(pty.rows, pty.cols, pty.height, pty.width)
    }

    process.stdout.on('resize', onResize)
    channel.on('close', () => {
      process.stdout.removeListener('resize', onResize)
      if (this.interactiveRawMode && tty.isatty(0)) {
        process.stdin.setRawMode(false)
        this.interactiveRawMode = false
      }
    })
  }

  // The SSH library otherwise requests a generic 80 by 24 terminal and never
  // updates it. Line editors track the cursor from that size, so the request
  // has to match the local terminal.
  private _ptyOptions(): Pick<Required<PseudoTtyOptions>, 'cols' | 'height' | 'rows' | 'term' | 'width'> {
    const cols = process.stdout.columns || 80
    const rows = process.stdout.rows || 24
    return {
      cols,
      height: rows * 16,
      rows,
      term: process.env.TERM || 'xterm-256color',
      width: cols * 8,
    }
  }

  private _readData(c: stream.Writable) {
    let firstLine = true
    return (data: Buffer | string) => {
      if (firstLine) {
        firstLine = false
        this._readStdin(c)
      }

      if (!data) return

      // A live terminal must see the remote bytes unchanged. Shells reprint the
      // input line with a trailing space and a carriage return; rewriting
      // " \r" into a newline drops the cursor after a few characters.
      // Piped output keeps that historical rewrite.
      if (tty.isatty(1)) {
        process.stdout.write(data)
        return
      }

      const text = typeof data === 'string' ? data : data.toString()
      process.stdout.write(text.replace(' \r', '\n'))
    }
  }

  private _readStdin(c: stream.Writable) {
    const {stdin} = process
    if (stdin.unref) stdin.unref()
    if (tty.isatty(0)) {
      // Leave stdin as raw bytes. Encoding it as text splits keystrokes and
      // cursor-position replies before they are written to the SSH channel.
      stdin.setRawMode(true)
      this.interactiveRawMode = true
      stdin.pipe(c)
      let sigints: Date[] = []
      stdin.on('data', (chunk: Buffer | string) => {
        const isSigint = Buffer.isBuffer(chunk) ? chunk.length === 1 && chunk[0] === 0x03 : chunk === '\u0003'
        if (isSigint) sigints.push(new Date())
        sigints = sigints.filter(d => d.getTime() > Date.now() - 1000)
        if (sigints.length >= 4) {
          ux.error('forcing dyno disconnect')
        }
      })
    } else {
      stdin.setEncoding('utf8')
      stdin.pipe(this._stdinToRemote(c))
    }
  }

  // A SOCKS-server bind failure fires asynchronously, outside run()'s
  // error-handling chain, so throwing here (ux.error) would surface as an
  // unhandled crash with a raw stack trace. Route it through oclif's handler so
  // it prints cleanly and exits non-zero. (Extracted as a seam so tests can stub
  // it — Errors.handle exits the process and can't be stubbed as an ESM export.)
  private _reportProxyBindError(err: NodeJS.ErrnoException, socksPort: number): void {
    const detail = err.code === 'EADDRINUSE'
      ? `port ${socksPort} is already in use — stop the process using it and try again`
      : err.message
    Errors.handle(new Errors.CLIError(`Could not start the SOCKS proxy server: ${detail}`, {exit: 1}))
  }

  // Bridges piped stdin to the remote exec stream, appending an EOF (^D) when
  // stdin ends. For a non-interactive command the remote stream (`c`) closes as
  // soon as the command exits — which can happen before stdin reaches EOF — so
  // every write is guarded on `c.writable` (don't write the trailing EOF to an
  // already-ended stream) and a late write-after-end is swallowed as the
  // teardown race it is, rather than surfacing as an unhandled error that
  // crashes the CLI.
  private _stdinToRemote(c: stream.Writable): stream.Transform {
    const transform = new stream.Transform({
      // Pass the stream callbacks straight through so a genuine write error
      // reaches the 'error' handler below instead of being silently dropped.
      flush: done => (c.writable ? c.write('\u0004', done) : done()),
      transform: (chunk, _, next) => (c.writable ? c.write(chunk, next) : next()),
    })
    transform.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code !== 'ERR_STREAM_WRITE_AFTER_END') sshDebug(error)
    })
    return transform
  }
}
