import * as color from '@heroku/heroku-cli-util/color'
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
import {Client, ConnectConfig} from 'ssh2'

import socks5 from './socks5-server.js'

const sshDebug = debug('cli:ps-exec:ssh')

export class HerokuSsh {
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
          conn.exec(cmd, {pty: true}, (err, stream) => {
            sshDebug('[cli-ssh] exec')
            if (err) {
              sshDebug(`[cli-ssh] err: ${err}`)
              throw err
            }

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
          conn.shell((err, stream) => {
            sshDebug('[cli-ssh] shell')
            if (err) {
              sshDebug(`[cli-ssh] err: ${err}`)
              return this._logConnectionError()
            }

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
      }).connect({
        ...this._connectionDefaults(proxyKey),
        debug: sshDebug,
        host: addonHost,
        keepaliveCountMax: 3,
        keepaliveInterval: 10_000,
        privateKey,
        username: dynoUser,
      })
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
    socks5.createServer((info, accept, deny) => {
      const conn = new Client()
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

            clientSocket = accept()
            if (!clientSocket) {
              conn.end()
              return
            }

            // Tear the tunnel down if either side errors, rather than letting an
            // unhandled 'error' event crash the CLI.
            stream.on('error', teardown)
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

      let sshCommand = 'ssh '
        + `-o UserKnownHostsFile=${proxyKeyPath} `
        + '-o ServerAliveInterval=10 '
        + '-o ServerAliveCountMax=3 '
        + '-p 80 '
        + `-i ${keyPath} `
        + `${dynoUser}@${addonHost} `

      if (context.args.length > 0 && !context.args.includes('bash')) {
        sshCommand = `${sshCommand} ${this._buildCommand(context.args)}`
      }

      try {
        child.execSync(sshCommand, {stdio: ['inherit', 'inherit', 'ignore']})
      } catch (error: any) {
        if (error.stderr) sshDebug(error.stderr)
        sshDebug(`[cli-ssh] exit: ${error.status}, ${error.message}`)
      }
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
        const hasher = crypto.createHash('sha256')
        hasher.update(Buffer.from(proxyKey.split(' ')[1], 'base64'))
        return hasher.digest('hex') === hashedKey
      },
      port: 80,
    }
  }

  private _logConnectionError() {
    ux.error(`Could not connect to the dyno. Check that the dyno is active by running ${color.command('heroku ps')}`)
  }

  private _readData(c: stream.Writable) {
    let firstLine = true
    return (data: Buffer | string) => {
      if (firstLine) {
        firstLine = false
        this._readStdin(c)
      }

      if (data) {
        data = data.toString().replace(' \r', '\n')
        process.stdout.write(data)
      }
    }
  }

  private _readStdin(c: stream.Writable) {
    const {stdin} = process
    stdin.setEncoding('utf8')
    if (stdin.unref) stdin.unref()
    if (tty.isatty(0)) {
      stdin.setRawMode(true)
      stdin.pipe(c)
      let sigints: Date[] = []
      stdin.on('data', (c: string) => {
        if (c === '\u0003') sigints.push(new Date())
        sigints = sigints.filter(d => d.getTime() > Date.now() - 1000)
        if (sigints.length >= 4) {
          ux.error('forcing dyno disconnect')
        }
      })
    } else {
      stdin.pipe(this._stdinToRemote(c))
    }
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
