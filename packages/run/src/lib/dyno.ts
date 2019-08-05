import color from '@heroku-cli/color'
import {APIClient} from '@heroku-cli/command'
import {IOptions} from '@heroku-cli/command/lib/api-client'
import {Notification, notify} from '@heroku-cli/notifications'
import {Dyno as APIDyno} from '@heroku-cli/schema'
import {spawn} from 'child_process'
import cli from 'cli-ux'
import DebugFactory from 'debug'
import * as http from 'http'
import {HTTP} from 'http-call'
import * as net from 'net'
import {Duplex, Transform} from 'stream'
import * as tls from 'tls'
import * as tty from 'tty'
import * as url from 'url'

import {buildEnvFromFlag} from '../lib/helpers'

const debug = DebugFactory('heroku:run')
const wait = (ms: number) => new Promise(resolve => setTimeout(() => resolve(), ms))

interface HerokuApiClientRun extends APIClient {
  options: IOptions & {
    rejectUnauthorized?: boolean
  }
}

interface DynoOpts {
  'exit-code': boolean
  'no-tty': boolean
  app: string
  attach: boolean
  command: string
  dyno?: string
  env?: string
  heroku: APIClient
  listen: boolean
  notify: boolean
  showStatus?: boolean
  size?: string
  type?: string
}

export default class Dyno extends Duplex {
  get _useSSH() {
    if (this.uri) {
      return this.uri.protocol === 'http:' || this.uri.protocol === 'https:'
    }
  }
  dyno?: APIDyno
  heroku: HerokuApiClientRun
  input: any
  p: any
  reject?: (reason?: any) => void
  resolve?: (value?: unknown) => void
  uri?: url.UrlWithStringQuery
  unpipeStdin: any
  useSSH: any
  private _notified?: boolean
  private _startedAt?: number

  constructor(public opts: DynoOpts) {
    super()
    this.cork()
    this.opts = opts
    this.heroku = opts.heroku

    if (this.opts.showStatus === undefined) {
      this.opts.showStatus = true
    }
  }

  /**
   * Starts the dyno
   * @returns {Promise} promise resolved when dyno process is created
   */
  start() {
    this._startedAt = Date.now()
    const dynoStart = this._doStart()
    if (this.opts.showStatus) {
      return cli.action.start(`Running ${color.cyan.bold(this.opts.command)} on ${color.app(this.opts.app)}`)
    } else {
      return dynoStart
    }
  }

  _doStart(retries = 2): Promise<HTTP<unknown>> {
    let command = this.opts['exit-code'] ? `${this.opts.command}; echo "\uFFFF heroku-command-exit-status: $?"` : this.opts.command

    return this.heroku.post(this.opts.dyno ? `/apps/${this.opts.app}/dynos/${this.opts.dyno}` : `/apps/${this.opts.app}/dynos`, {
      headers: {
        Accept: this.opts.dyno ? 'application/vnd.heroku+json; version=3.run-inside' : 'application/vnd.heroku+json; version=3'
      },
      body: {
        command,
        attach: this.opts.attach,
        size: this.opts.size,
        type: this.opts.type,
        env: this._env(),
        force_no_tty: this.opts['no-tty']
      }
    })
      .then(dyno => {
        this.dyno = dyno
        if (this.opts.attach || this.opts.dyno) {
          if (this.dyno.name && this.opts.dyno === undefined) {
            this.opts.dyno = this.dyno.name
          }
          return this.attach()
        } else if (this.opts.showStatus) {
          cli.action.stop(this._status('done'))
        }
      })
      .catch(err => {
        // Currently the runtime API sends back a 409 in the event the
        // release isn't found yet. API just forwards this response back to
        // the client, so we'll need to retry these. This usually
        // happens when you create an app and immediately try to run a
        // one-off dyno. No pause between attempts since this is
        // typically a very short-lived condition.
        if (err.statusCode === 409 && retries > 0) {
          return this._doStart(retries - 1)
        } else {
          throw err
        }
      })
  }

  /**
   * Attaches stdin/stdout to dyno
   */
  attach() {
    this.pipe(process.stdout)
    if (this.dyno && this.dyno.attach_url) {
      this.uri = url.parse(this.dyno.attach_url)
    }
    if (this._useSSH) {
      this.p = this._ssh()
    } else {
      this.p = this._rendezvous()
    }
    return this.p.then(() => {
      this.end()
    })
  }

  _rendezvous() {
    return new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject

      if (this.opts.showStatus) {
        cli.action.status = this._status('starting')
      }
      let c = tls.connect(parseInt(this.uri.port, 10), this.uri.hostname, {
        rejectUnauthorized: this.heroku.options.rejectUnauthorized
      })
      c.setTimeout(1000 * 60 * 60)
      c.setEncoding('utf8')
      c.on('connect', () => {
        debug('connect')
        c.write(this.uri.path.substr(1) + '\r\n', () => {
          if (this.opts.showStatus) {
            cli.action.status = this._status('connecting')
          }
        })
      })
      c.on('data', this._readData(c))
      c.on('close', () => {
        debug('close')
        this.opts['exit-code'] ? this.reject('No exit code returned') : this.resolve()
        if (this.unpipeStdin) {
          this.unpipeStdin()
        }
      })
      c.on('error', this.reject)
      c.on('timeout', () => {
        debug('timeout')
        c.end()
        this.reject(new Error('timed out'))
      })
      process.once('SIGINT', () => c.end())
    })
  }

  async _ssh(retries = 20): Promise<unknown> {
    const interval = 1000

    try {
      const dyno = await this.heroku.get(`/apps/${this.opts.app}/dynos/${this.opts.dyno}`)
      this.dyno = dyno
      cli.action.stop(this._status(this.dyno.state))

      if (this.dyno.state === 'starting' || this.dyno.state === 'up') {
        return this._connect()
      } else {
        await wait(interval)
        return this._ssh()
      }
    } catch (err) {
      // the API sometimes responds with a 404 when the dyno is not yet ready
      if (err.statusCode === 404 && retries > 0) {
        return this._ssh(retries - 1)
      } else {
        throw err
      }
    }
  }

  _connect() {
    return new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject

      let options: http.RequestOptions & { rejectUnauthorized?: boolean } = this.uri
      options.headers = {Connection: 'Upgrade', Upgrade: 'tcp'}
      options.rejectUnauthorized = false
      let r = http.request(options)
      r.end()

      r.on('error', this.reject)
      r.on('upgrade', (_, remote, head) => {
        let s = net.createServer(client => {
          client.on('end', () => {
            s.close()
            this.resolve()
          })
          client.on('connect', () => s.close())

          client.on('error', () => this.reject)
          remote.on('error', () => this.reject)

          client.setNoDelay(true)
          remote.setNoDelay(true)

          remote.on('data', data => client.write(data))
          client.on('data', data => remote.write(data))
        })

        s.listen(0, 'localhost', () => this._handle(s))
        // abort the request when the local pipe server is closed
        s.on('close', () => {
          r.abort()
        })
      })
    })
  }

  _handle(localServer: net.Server) {
    let addr = localServer.address() as net.AddressInfo
    let host = addr.address
    let port = addr.port
    let lastErr = ''

    // does not actually uncork but allows error to be displayed when attempting to read
    this.uncork()
    if (this.opts.listen) {
      cli.log(`listening on port ${host}:${port} for ssh client`)
    } else {
      let params = [host, '-p', port.toString(), '-oStrictHostKeyChecking=no', '-oUserKnownHostsFile=/dev/null', '-oServerAliveInterval=20']

      const stdio: Array<(number | 'pipe')> = [0, 1, 'pipe']
      if (this.opts['exit-code']) {
        stdio[1] = 'pipe'
        if (process.stdout.isTTY) {
          // force tty
          params.push('-t')
        }
      }
      let sshProc = spawn('ssh', params, {stdio})

      // only receives stdout with --exit-code
      if (sshProc.stdout) {
        sshProc.stdout.setEncoding('utf8')
        sshProc.stdout.on('data', this._readData())
      }

      sshProc.stderr.on('data', data => {
        lastErr = data

        // supress host key and permission denied messages
        if (this._isDebug() || (data.includes("Warning: Permanently added '[127.0.0.1]") && data.includes('Permission denied (publickey).'))) {
          process.stderr.write(data)
        }
      })
      sshProc.on('close', (code, signal) => {
        // there was a problem connecting with the ssh key
        if (lastErr.length > 0 && lastErr.includes('Permission denied')) {
          cli.error('There was a problem connecting to the dyno.')
          if (process.env.SSH_AUTH_SOCK) {
            cli.error('Confirm that your ssh key is added to your agent by running `ssh-add`.')
          }
          cli.error('Check that your ssh key has been uploaded to heroku with `heroku keys:add`.')
          cli.error(`See ${color.cyan('https://devcenter.heroku.com/articles/one-off-dynos#shield-private-spaces')}`)
        }
        // cleanup local server
        localServer.close()
      })
      this.p
        .then(() => sshProc.kill())
        .catch(() => sshProc.kill())
    }
    this._notify()
  }

  _isDebug() {
    let debug = process.env.HEROKU_DEBUG
    return debug && (debug === '1' || debug.toUpperCase() === 'TRUE')
  }

  _env() {
    let c: {[key: string]: any} = this.opts.env ? buildEnvFromFlag(this.opts.env) : {}
    c.TERM = process.env.TERM
    if (tty.isatty(1)) {
      c.COLUMNS = process.stdout.columns
      c.LINES = process.stdout.rows
    }
    return c
  }

  _status(status) {
    let size = this.dyno.size ? ` (${this.dyno.size})` : ''
    return `${status}, ${this.dyno.name || this.opts.dyno}${size}`
  }

  _readData(c?: tls.TLSSocket) {
    let firstLine = true
    return data => {
      debug('input: %o', data)
      // discard first line
      if (c && firstLine) {
        if (this.opts.showStatus) cli.action.stop(this._status('up'))
        firstLine = false
        this._readStdin(c)
        return
      }
      this._notify()

      // carriage returns break json parsing of output
      // eslint-disable-next-line
      if (!process.stdout.isTTY) data = data.replace(new RegExp('\r\n', 'g'), '\n')

      let exitCode = data.match(/\uFFFF heroku-command-exit-status: (\d+)/m)
      if (exitCode) {
        debug('got exit code: %d', exitCode[1])
        this.push(data.replace(/^\uFFFF heroku-command-exit-status: \d+$\n?/m, ''))
        let code = parseInt(exitCode[1])
        if (code === 0) this.resolve()
        else {
          let err: { exitCode?: number } & Error = new Error(`Process exited with code ${color.red(code.toString())}`)
          err.exitCode = code
          this.reject(err)
        }
        return
      }
      this.push(data)
    }
  }

  _readStdin(c) {
    this.input = c
    let stdin: NodeJS.ReadStream & { unref?(): any } = process.stdin
    stdin.setEncoding('utf8')

    // without this the CLI will hang on rake db:migrate
    // until a character is pressed
    if (stdin.unref) {
      stdin.unref()
    }

    if (!this.opts['no-tty'] && tty.isatty(0)) {
      stdin.setRawMode(true)
      stdin.pipe(c)
      let sigints = []
      stdin.on('data', function (c) {
        if (c === '\u0003') {
          sigints.push(Date.now())
        }

        sigints = sigints.filter(d => d > Date.now() - 1000)

        if (sigints.length >= 4) {
          cli.error('forcing dyno disconnect')
          process.exit(1)
        }
      })
    } else {
      stdin.pipe(new Transform({
        objectMode: true,
        transform: (chunk, _, next) => c.write(chunk, next),
        flush: done => c.write('\x04', done)
      }))
    }
    this.uncork()
  }

  _read() {
    if (this.useSSH) {
      throw new Error('Cannot read stream from ssh dyno')
    }
    // do not need to do anything to handle Readable interface
  }

  _write(chunk, encoding, callback) {
    if (this.useSSH) {
      throw new Error('Cannot write stream to ssh dyno')
    }
    if (!this.input) throw new Error('no input')
    this.input.write(chunk, encoding, callback)
  }

  _notify() {
    try {
      if (this._notified) return
      this._notified = true
      if (!this.opts.notify) return
      // only show notifications if dyno took longer than 20 seconds to start
      if (Date.now() - this._startedAt < 1000 * 20) return

      let notification: Notification & { subtitle?: string } = {
        title: this.opts.app,
        subtitle: `heroku run ${this.opts.command}`,
        message: 'dyno is up'
        // sound: true
      }

      notify(notification)
    } catch (err) {
      cli.warn(err)
    }
  }

}

// /** Represents a dyno process */
// class Dyno extends Duplex {
//   opts: any
//   heroku: any
//   _startedAt: Date
//   dyno: any
//   uri: any
//   p: any
//   resolve: (value?: unknown) => void
//   reject: (reason?: any) => void
//   input: any
//   _notified: boolean
//   /**
//    * @param {Object} options
//    * @param {Object} options.heroku - instance of heroku-client
//    * @param {boolean} options.exit-code - get exit code from process
//    * @param {string} options.command - command to run
//    * @param {string} options.app - app to run dyno on
//    * @param {string} options.attach - attach to dyno
//    * @param {string} options.size - size of dyno to create
//    * @param {string} options.type - type of dyno to create
//    * @param {boolean} options.no-tty - force not to use a tty
//    * @param {Object} options.env - dyno environment variables
//    * @param {boolean} options.notify - show notifications or not
//   */
//   constructor(opts) {
//     super()
//     this.cork()
//     this.opts = opts
//     this.heroku = opts.heroku
//     if (this.opts.showStatus === undefined) this.opts.showStatus = true
//   }

//   /**
//    * Starts the dyno
//    * @returns {Promise} promise resolved when dyno process is created
//    */
//   start() {
//     this._startedAt = new Date()
//     const dynoStart = this._doStart()
//     if (this.opts.showStatus) {
//       return cli.action(`Running ${cli.color.cyan.bold(this.opts.command)} on ${cli.color.app(this.opts.app)}`, {success: false}, dynoStart)
//     } else return dynoStart
//   }

//   _doStart(retries = 2) {
//     let command = this.opts['exit-code'] ? `${this.opts.command}; echo "\uFFFF heroku-command-exit-status: $?"` : this.opts.command
//     return this.heroku.post(this.opts.dyno ? `/apps/${this.opts.app}/dynos/${this.opts.dyno}` : `/apps/${this.opts.app}/dynos`, {
//       headers: {
//         Accept: this.opts.dyno ? 'application/vnd.heroku+json; version=3.run-inside' : 'application/vnd.heroku+json; version=3'
//       },
//       body: {
//         command,
//         attach: this.opts.attach,
//         size: this.opts.size,
//         type: this.opts.type,
//         env: this._env(),
//         force_no_tty: this.opts['no-tty']
//       }
//     })
//       .then(dyno => {
//         this.dyno = dyno
//         if (this.opts.attach || this.opts.dyno) {
//           if (this.dyno.name && this.opts.dyno === undefined) this.opts.dyno = this.dyno.name
//           return this.attach()
//         } else if (this.opts.showStatus) {
//           cli.action.done(this._status('done'))
//         }
//       })
//       .catch(err => {
//       // Currently the runtime API sends back a 409 in the event the
//       // release isn't found yet. API just forwards this response back to
//       // the client, so we'll need to retry these. This usually
//       // happens when you create an app and immediately try to run a
//       // one-off dyno. No pause between attempts since this is
//       // typically a very short-lived condition.
//         if (err.statusCode === 409 && retries > 0) {
//           return this._doStart(retries - 1)
//         } else {
//           throw err
//         }
//       })
//   }

//   /**
//    * Attaches stdin/stdout to dyno
//    */
//   attach() {
//     this.pipe(process.stdout)
//     this.uri = url.parse(this.dyno.attach_url)
//     if (this._useSSH) {
//       this.p = this._ssh()
//     } else {
//       this.p = this._rendezvous()
//     }
//     return this.p.then(() => {
//       this.end()
//     })
//   }

//   get _useSSH() {
//     return this.uri.protocol === 'http:' || this.uri.protocol === 'https:'
//   }

//   _rendezvous() {
//     return new Promise((resolve, reject) => {
//       this.resolve = resolve
//       this.reject = reject

//       if (this.opts.showStatus) cli.action.status(this._status('starting'))
//       let c = tls.connect(this.uri.port, this.uri.hostname, {rejectUnauthorized: this.heroku.options.rejectUnauthorized})
//       c.setTimeout(1000 * 60 * 60)
//       c.setEncoding('utf8')
//       c.on('connect', () => {
//         debug('connect')
//         c.write(this.uri.path.substr(1) + '\r\n', () => {
//           if (this.opts.showStatus) cli.action.status(this._status('connecting'))
//         })
//       })
//       c.on('data', this._readData(c))
//       c.on('close', () => {
//         debug('close')
//         this.opts['exit-code'] ? this.reject('No exit code returned') : this.resolve()
//         if (this.unpipeStdin) this.unpipeStdin()
//       })
//       c.on('error', this.reject)
//       c.on('timeout', () => {
//         debug('timeout')
//         c.end()
//         this.reject(new Error('timed out'))
//       })
//       process.once('SIGINT', () => c.end())
//     })
//   }

//   async _ssh(retries = 20) {
//     const interval = 1000

//     try {
//       const dyno = await this.heroku.get(`/apps/${this.opts.app}/dynos/${this.opts.dyno}`)
//       this.dyno = dyno
//       cli.action.done(this._status(this.dyno.state))

//       if (this.dyno.state === 'starting' || this.dyno.state === 'up') {
//         return this._connect()
//       } else {
//         await wait(interval)
//         return this._ssh()
//       }
//     } catch (err) {
//       // the API sometimes responds with a 404 when the dyno is not yet ready
//       if (err.statusCode === 404 && retries > 0) {
//         return this._ssh(retries - 1)
//       } else {
//         throw err
//       }
//     }
//   }

//   _connect() {
//     return new Promise((resolve, reject) => {
//       this.resolve = resolve
//       this.reject = reject

//       let options = this.uri
//       options.headers = {Connection: 'Upgrade', Upgrade: 'tcp'}
//       options.rejectUnauthorized = false
//       let r = http.request(options)
//       r.end()

//       r.on('error', this.reject)
//       r.on('upgrade', (_, remote, head) => {
//         let s = net.createServer(client => {
//           client.on('end', () => {
//             s.close()
//             this.resolve()
//           })
//           client.on('connect', () => s.close())

//           client.on('error', () => this.reject)
//           remote.on('error', () => this.reject)

//           client.setNoDelay(true)
//           remote.setNoDelay(true)

//           remote.on('data', data => client.write(data))
//           client.on('data', data => remote.write(data))
//         })

//         s.listen(0, 'localhost', () => this._handle(s))
//         // abort the request when the local pipe server is closed
//         s.on('close', () => {
//           r.abort()
//         })
//       })
//     })
//   }

//   _handle(localServer: net.Server) {
//     let addr = localServer.address() as net.AddressInfo
//     let host = addr.address
//     let port = addr.port
//     let lastErr = ''

//     // does not actually uncork but allows error to be displayed when attempting to read
//     this.uncork()
//     if (this.opts.listen) {
//       cli.log(`listening on port ${host}:${port} for ssh client`)
//     } else {
//       let params = [host, '-p', port, '-oStrictHostKeyChecking=no', '-oUserKnownHostsFile=/dev/null', '-oServerAliveInterval=20']

//       const stdio = [0, 1, 'pipe']
//       if (this.opts['exit-code']) {
//         stdio[1] = 'pipe'
//         if (process.stdout.isTTY) {
//           // force tty
//           params.push('-t')
//         }
//       }
//       let sshProc = spawn('ssh', params, {stdio})

//       // only receives stdout with --exit-code
//       if (sshProc.stdout) {
//         sshProc.stdout.setEncoding('utf8')
//         sshProc.stdout.on('data', this._readData())
//       }

//       sshProc.stderr.on('data', (data: string) => {
//         lastErr = data

//         // supress host key and permission denied messages
//         if (this._isDebug() || (data.includes("Warning: Permanently added '[127.0.0.1]") && data.includes('Permission denied (publickey).'))) {
//           process.stderr.write(data)
//         }
//       })
//       sshProc.on('close', () => {
//         // there was a problem connecting with the ssh key
//         if (lastErr.length > 0 && lastErr.includes('Permission denied')) {
//           cli.error('There was a problem connecting to the dyno.')
//           if (process.env.SSH_AUTH_SOCK) {
//             cli.error('Confirm that your ssh key is added to your agent by running `ssh-add`.')
//           }
//           cli.error('Check that your ssh key has been uploaded to heroku with `heroku keys:add`.')
//           cli.error(`See ${cli.color.cyan('https://devcenter.heroku.com/articles/one-off-dynos#shield-private-spaces')}`)
//         }
//         // cleanup local server
//         localServer.close()
//       })
//       this.p
//         .then(() => sshProc.kill())
//         .catch(() => sshProc.kill())
//     }
//     this._notify()
//   }

//   _isDebug() {
//     let debug = process.env.HEROKU_DEBUG
//     return debug && (debug === '1' || debug.toUpperCase() === 'TRUE')
//   }

//   _env() {
//     let c = this.opts.env ? buildEnvFromFlag(this.opts.env) : {}
//     c.TERM = process.env.TERM
//     if (tty.isatty(1)) {
//       c.COLUMNS = process.stdout.columns
//       c.LINES = process.stdout.rows
//     }
//     return c
//   }

//   _status(status: string) {
//     let size = this.dyno.size ? ` (${this.dyno.size})` : ''
//     return `${status}, ${this.dyno.name || this.opts.dyno}${size}`
//   }

//   _readData(c?: string) {
//     let firstLine = true
//     return (data: string) => {
//       debug('input: %o', data)
//       // discard first line
//       if (c && firstLine) {
//         if (this.opts.showStatus) cli.action.done(this._status('up'))
//         firstLine = false
//         this._readStdin(c)
//         return
//       }
//       this._notify()

//       // carriage returns break json parsing of output
//       // eslint-disable-next-line
//       if (!process.stdout.isTTY) data = data.replace(new RegExp('\r\n', 'g'), '\n')

//       let exitCode = data.match(/\uFFFF heroku-command-exit-status: (\d+)/m)
//       if (exitCode) {
//         debug('got exit code: %d', exitCode[1])
//         this.push(data.replace(/^\uFFFF heroku-command-exit-status: \d+$\n?/m, ''))
//         let code = parseInt(exitCode[1], 10)
//         if (code === 0) {
//           this.resolve()
//         } else {
//           let err = new Error(`Process exited with code ${cli.color.red(code)}`)
//           err.exitCode = code
//           this.reject(err)
//         }
//         return
//       }
//       this.push(data)
//     }
//   }

//   _readStdin(c: string) {
//     this.input = c
//     let stdin = process.stdin
//     stdin.setEncoding('utf8')

//     // without this the CLI will hang on rake db:migrate
//     // until a character is pressed
//     if (stdin.unref) stdin.unref()

//     if (!this.opts['no-tty'] && tty.isatty(0)) {
//       if (stdin.setRawMode) {
//         stdin.setRawMode(true)
//       }
//       stdin.pipe(c)
//       let sigints = []
//       stdin.on('data', function (c) {
//         if (c === '\u0003') sigints.push(new Date())
//         sigints = sigints.filter(d => d > new Date() - 1000)
//         if (sigints.length >= 4) {
//           cli.error('forcing dyno disconnect')
//           process.exit(1)
//         }
//       })
//     } else {
//       stdin.pipe(new Transform({
//         objectMode: true,
//         transform: (chunk, _, next) => c.write(chunk, next),
//         flush: done => c.write('\x04', done)
//       }))
//     }
//     this.uncork()
//   }

//   _read() {
//     if (this.useSSH) {
//       throw new Error('Cannot read stream from ssh dyno')
//     }
//     // do not need to do anything to handle Readable interface
//   }

//   _write(chunk, encoding, callback) {
//     if (this.useSSH) {
//       throw new Error('Cannot write stream to ssh dyno')
//     }
//     if (!this.input) throw new Error('no input')
//     this.input.write(chunk, encoding, callback)
//   }

//   _notify() {
//     try {
//       if (this._notified) return
//       this._notified = true
//       if (!this.opts.notify) return
//       // only show notifications if dyno took longer than 20 seconds to start
//       if (new Date() - this._startedAt < 1000 * 20) return
//       notify({
//         title: this.opts.app,
//         subtitle: `heroku run ${this.opts.command}`,
//         message: 'dyno is up'
//         // sound: true
//       })
//     } catch (err) {
//       cli.warn(err)
//     }
//   }
// }
