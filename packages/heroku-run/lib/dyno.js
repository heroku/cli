'use strict'

let tls = require('tls')
let url = require('url')
let tty = require('tty')
let stream = require('stream')
let cli = require('heroku-cli-util')
let helpers = require('../lib/helpers')

/** Represents a dyno process */
class Dyno {
  /**
   * @param {Object} options
   * @param {Object} options.heroku - instance of heroku-client
   * @param {boolean} options.exit-code - get exit code from process
   * @param {string} options.command - command to run
   * @param {string} options.app - app to run dyno on
   * @param {string} options.attach - attach to dyno
   * @param {string} options.size - size of dyno to create
   * @param {boolean} options.no-tty - force not to use a tty
   * @param {Object} options.env - dyno environment variables
  */
  constructor (opts) {
    this.opts = opts
    this.heroku = opts.heroku
    if (this.opts.showStatus === undefined) this.opts.showStatus = true
  }

  /**
   * Starts the dyno
   * @returns {Promise} promise resolved when dyno process is created
   */
  start () {
    let command = this.opts['exit-code'] ? `${this.opts.command}; echo heroku-command-exit-status $?` : this.opts.command
    let start = this.heroku.request({
      path: this.opts.dyno ? `/apps/${this.opts.app}/dynos/${this.opts.dyno}` : `/apps/${this.opts.app}/dynos`,
      method: 'POST',
      headers: {
        Accept: this.opts.dyno ? 'application/vnd.heroku+json; version=3.run-inside' : 'application/vnd.heroku+json; version=3'
      },
      body: {
        command: command,
        attach: this.opts.attach,
        size: this.opts.size,
        env: this._env(),
        force_no_tty: this.opts['no-tty']
      }
    })
    .then(dyno => {
      this.dyno = dyno
      if (this.opts.attach || this.opts.dyno) return this.attach()
      else if (this.opts.showStatus) cli.action.done(this._status('done'))
    })

    if (this.opts.showStatus) {
      return cli.action(`Running ${cli.color.cyan.bold(this.opts.command)} on ${cli.color.app(this.opts.app)}`, {success: false}, start)
    } else return start
  }

  /**
   * Attaches stdin/stdout to dyno
   */
  attach () {
    return new Promise((resolve, reject) => {
      if (this.opts.showStatus) cli.action.status(this._status('starting'))
      this.resolve = resolve
      this.reject = reject
      let uri = url.parse(this.dyno.attach_url)
      let c = tls.connect(uri.port, uri.hostname, {rejectUnauthorized: this.heroku.options.rejectUnauthorized})
      c.setTimeout(1000 * 60 * 20)
      c.setEncoding('utf8')
      c.on('connect', () => {
        c.write(uri.path.substr(1) + '\r\n', () => {
          if (this.opts.showStatus) cli.action.status(this._status('connecting'))
        })
      })
      c.on('data', this._readData(c))
      c.on('close', () => {
        this.opts['exit-code'] ? reject('No exit code returned') : resolve()
        if (this.unpipeStdin) this.unpipeStdin()
      })
      c.on('error', reject)
      process.once('SIGINT', () => c.end())
    })
  }

  _env () {
    let c = this.opts.env ? helpers.buildEnvFromFlag(this.opts.env) : {}
    c.TERM = process.env.TERM
    if (tty.isatty(1)) {
      c.COLUMNS = process.stdout.columns
      c.LINES = process.stdout.rows
    }
    return c
  }

  _status (status) {
    return `${status}, ${this.dyno.name || this.opts.dyno}`
  }

  _readData (c) {
    let firstLine = true
    return data => {
      // discard first line
      if (firstLine) {
        if (this.opts.showStatus) cli.action.done(this._status('up'))
        firstLine = false
        this._readStdin(c)
        return
      }
      data = data.replace('\r\n', '\n')
      let exitCode = data.match(/heroku-command-exit-status (\d+)/m)
      if (exitCode) {
        process.stdout.write(data.replace(/^heroku-command-exit-status \d+$\n?/m, ''))
        let code = parseInt(exitCode[1])
        if (code === 0) this.resolve()
        else {
          let err = new Error(`Process exited with code ${cli.color.red(code)}`)
          err.exitCode = code
          this.reject(err)
        }
        return
      }
      process.stdout.write(data)
    }
  }

  _readStdin (c) {
    let stdin = process.stdin
    stdin.setEncoding('utf8')
    if (stdin.unref) stdin.unref()
    if (tty.isatty(0)) {
      stdin.setRawMode(true)
      stdin.pipe(c)
      let sigints = []
      stdin.on('data', function (c) {
        if (c === '\u0003') sigints.push(new Date())
        sigints = sigints.filter(d => d > new Date() - 1000)
        if (sigints.length >= 4) {
          cli.error('forcing dyno disconnect')
          process.exit(1)
        }
      })
    } else {
      stdin.pipe(new stream.Transform({
        objectMode: true,
        transform: (chunk, _, next) => c.write(chunk, next),
        flush: done => c.write('\x04', done)
      }))
    }
  }
}

module.exports = Dyno
