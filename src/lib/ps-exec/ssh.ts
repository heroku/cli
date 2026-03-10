import {color} from '@heroku/heroku-cli-util'
import socks from '@heroku/socksv5'
import {ux} from '@oclif/core'
import child from 'child_process'
import cliProgress from 'cli-progress'
import crypto from 'crypto'
import debug from 'debug'
import fs from 'fs'
import {Client, ConnectConfig} from 'ssh2'
import stream from 'stream'
import tmp from 'tmp'
import tty from 'tty'

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
          conn.exec(cmd, (err, stream) => {
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
              .on('error', reject)
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
        keepaliveInterval: 10000,
        privateKey,
        username: dynoUser,
      })
    })
  }

  public ssh(context: {args: string[]}, addonHost: string, dynoUser: string, privateKey: Buffer | string, proxyKey: string) {
    sshDebug('[cli-ssh] native')
    return new Promise<void>(() => {
      tmp.setGracefulCleanup()
      tmp.file({prefix: 'heroku-exec-key'}, (error: Error | null, infoPath: string, infoFd: number) => {
        if (!error) {
          fs.writeSync(infoFd, Buffer.isBuffer(privateKey) ? privateKey : Buffer.from(privateKey))
          fs.close(infoFd, () => {
            fs.chmodSync(infoPath, '0700')
            tmp.file({prefix: 'heroku-exec-proxy-key'}, (error: Error | null, proxyKeyPath: string, proxyKeyFd: number) => {
              if (!error) {
                fs.writeSync(proxyKeyFd, `[${addonHost}]:80 ${proxyKey}`)
                fs.close(proxyKeyFd, () => {
                  let sshCommand = 'ssh '
                    + `-o UserKnownHostsFile=${proxyKeyPath} `
                    + '-o ServerAliveInterval=10 '
                    + '-o ServerAliveCountMax=3 '
                    + '-p 80 '
                    + `-i ${infoPath} `
                    + `${dynoUser}@${addonHost} `

                  if (context.args.length > 0 && !context.args.includes('bash')) {
                    sshCommand = `${sshCommand} ${this._buildCommand(context.args)}`
                  }

                  try {
                    child.execSync(sshCommand, {stdio: ['inherit', 'inherit', 'ignore']},
                    )
                  } catch (error: any) {
                    if (error.stderr) sshDebug(error.stderr)
                    sshDebug(`[cli-ssh] exit: ${error.status}, ${error.message}`)
                  }
                })
              }
            })
          })
        }
      })
    })
  }

  public scp(addonHost: string, dynoUser: string, privateKey: Buffer | string, proxyKey: string, src: string, dest: string) {
    return new Promise<void>((resolve, reject) => {
      const conn = new Client()
      conn.on('ready', () => {
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
      }).on('error', reject).connect({
        ...this._connectionDefaults(proxyKey),
        host: addonHost,
        privateKey,
        username: dynoUser,
      })
    })
  }

  public socksv5(addonHost: string, dynoUser: string, privateKey: Buffer | string, proxyKey: string, callback?: ((port: number) => void)) {
    const socksPort = 1080
    socks.createServer((info, accept, deny) => {
      const conn = new Client()
      conn.on('ready', () => {
        conn.forwardOut(info.srcAddr,
          info.srcPort,
          info.dstAddr,
          info.dstPort,
          (err, stream) => {
            if (err) {
              conn.end()
              return deny()
            }

            const clientSocket = accept(true)
            if (clientSocket) {
              stream.pipe(clientSocket).pipe(stream).on('close', () => {
                conn.end()
              })
            } else
              conn.end()
          })
      }).on('error', () => {
        deny()
      }).connect({
        ...this._connectionDefaults(proxyKey),
        host: addonHost,
        privateKey,
        username: dynoUser,
      })
    }).listen(socksPort, '127.0.0.1', () => {
      console.log(`SOCKSv5 proxy server started on port ${color.info(socksPort.toString())}`)
      if (callback) callback(socksPort)
    }).useAuth(socks.auth.None()) // eslint-disable-line new-cap
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
      stdin.pipe(new stream.Transform({
        flush: done => c.write('\u0004', done),
        objectMode: true,
        transform: (chunk, _, next) => c.write(chunk, next),
      }))
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
        arg = '"' + arg.replaceAll('"', '\\"') + '"'
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
}
