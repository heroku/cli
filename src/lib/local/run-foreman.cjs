// Copyright IBM Corp. 2012,2015. All Rights Reserved.
// Node module: foreman
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

// This file is copied from the Node Foreman package. It was copied in order to fix
// a bug related to the use of port 5000 as a default. It is not meant to be a
// long-term solution, we plan to eventually remove our dependency on Node Foreman.

// These rules are disabled in order to prevent the need for refactoring
/* eslint-disable guard-for-in */
/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable  no-undef */
/* eslint-disable n/no-process-exit */
/* eslint-disable unicorn/no-process-exit */
/* eslint-disable no-new */
/* eslint-disable radix */

const program = require('commander')
const colors = require('foreman/lib/colors')
const events = require('node:events')
const fs = require('node:fs')
const path = require('node:path')
const {quote} = require('shell-quote')
const display = require('foreman/lib/console').Console
const _envs    = require('foreman/lib/envs')
const exporters = require('foreman/lib/exporters')
const {startForward} = require('foreman/lib/forward')
const _proc = require('foreman/lib/proc')
const _procfile = require('foreman/lib/procfile')
const {startProxies} = require('foreman/lib/proxy')
const _requirements    = require('foreman/lib/requirements')
const foremanPjson = require('foreman/package.json')

program.version(foremanPjson.version)
program.option('-j, --procfile <FILE>', 'load procfile FILE', 'Procfile')
program.option('-e, --env      <FILE>', 'load environment from FILE, a comma-separated list', '.env')
program.option('-p, --port     <PORT>', 'start indexing ports at number PORT', 0)

// Foreman Event Bus/Emitter //

const emitter = new events.EventEmitter()
emitter.once('killall', signal => {
  display.Done('Killing all processes with signal ', signal)
})
emitter.setMaxListeners(50)

const {start} = _proc
const {once} = _proc

const {loadProc} = _procfile

const {loadEnvs} = _envs

const {getreqs} = _requirements
const {calculatePadding} = _requirements

// Kill All Child Processes on SIGINT
process.once('SIGINT', () => {
  display.Warn('Interrupted by User')
  emitter.emit('killall', 'SIGINT')
})

program
  .command('start [procs]')
  .usage('[Options] [Processes] e.g. web=1,log=2,api')
  .option('-s, --showenvs', 'show ENV variables on start', false)
  .option('-x, --proxy     <PORT>', 'start a load balancing proxy on PORT')
  .option('--ssl-key       <KEY FILE>', 'a key file to use when proxying SSL')
  .option('--ssl-cert      <CERT FILE>', 'a cert file to use when proxying SSL')
  .option('-f, --forward   <PORT>', 'start a forward proxy on PORT')
  .option('-i, --intercept <HOSTNAME>', 'set forward proxy to intercept HOSTNAME', null)
  .option('-r, --raw', 'raw log output with no app name, timestamp, wrap or trim', false)
  .option('-t, --trim      <N>', 'trim logs to N characters', 0)
  .option('-w, --wrap', 'wrap logs (negates trim)')
  .description('Start the jobs in the Procfile')
  .action(function (args) {
    const envs = loadEnvs(program.env)

    const proc = loadProc(program.procfile)

    if (!proc) {
      return
    }

    if (this.showenvs) {
      for (const key in envs) {
        display.Alert('env %s=%s', key, envs[key])
      }
    }

    const reqs = getreqs(args, proc)

    display.padding  = calculatePadding(reqs)

    display.raw = this.raw

    if (this.wrap) {
      display.wrapline = process.stdout.columns - display.padding - 7
      display.trimline = 0
      display.Alert('Wrapping display Output to %d Columns', display.wrapline)
    } else {
      display.trimline = this.trim
      if (display.trimline > 0) {
        display.Alert('Trimming display Output to %d Columns', display.trimline)
      }
    }

    if (this.forward) {
      startForward(this.forward, this.intercept, emitter)
    }

    // using port 5006 because it is not known to be used by other common software
    startProxies(reqs, proc, this, emitter, program.port || envs.PORT || process.env.PORT || 5006)

    start(proc, reqs, envs, program.port || envs.PORT || process.env.PORT || 5006, emitter)
  })

program
  .command('run <COMMAND...>')
  .usage('[Options]')
  .option('-s, --showenvs', 'show ENV variables on start', false)
  .description('Run a one off process using the ENV variables')
  .action(function (args) {
    const envs = loadEnvs(program.env)

    const callback = function (code) {
      process.exit(code)
    }

    if (!args || args.length === 0) {
      return
    }

    const input = quote(args)

    if (this.showenvs) {
      for (const key in envs) {
        display.Alert('env %s=%s', key, envs[key])
      }
    }

    display.trimline = process.stdout.columns - 5

    once(input, envs, callback)
  })

program
  .command('export [PROCS]')
  .option('-a, --app  <NAME>', 'export upstart application as NAME', 'foreman')
  .option('-u, --user <NAME>', 'export upstart user as NAME', 'root')
  .option('-o, --out  <DIR>', 'export upstart files to DIR', '.')
  .option('-c, --cwd  <DIR>', 'change current working directory to DIR')
  .option('-g, --gid  <GID>', 'set gid of upstart config to GID')
  .option('-l, --log  <DIR>', 'specify upstart log directory', '/var/log')
  .option('-t, --type <TYPE>', 'export file to TYPE (default upstart)', 'upstart')
  .option('-m, --template <DIR>', 'use template folder')
  .description('Export to an upstart job independent of foreman')
  .action(function (procArgs) {
    const envs = loadEnvs(program.env)

    const procs = loadProc(program.procfile)

    if (!procs) {
      return
    }

    const req  = getreqs(procArgs, procs)

    // Variables for Upstart Template
    const config = {
      application: this.app,
      cwd: path.resolve(process.cwd(), this.cwd || ''),
      envs,
      group: this.gid || this.user,
      logs: this.log,
      template: this.template,
      user: this.user,
    }

    config.envfile = path.resolve(program.env)

    let writeout
    if (exporters[this.type]) {
      writeout = exporters[this.type]
    } else {
      new display.Error('Unknown Export Format', this.type)
      process.exit(1)
    }

    // Check for Upstart User
    // friendly warning - does not stop export
    let userExists = false
    for (const line of fs.readFileSync('/etc/passwd')
      .toString().split(/\n/)) {
      if (line.match(/^[^:]*/)[0] === config.user) {
        userExists = true
      }
    }

    if (!userExists) {
      display.Warn(display.fmt('User %s Does Not Exist on System', config.user))
    }

    // using port 5006 because it is not known to be used by other common software
    const baseport = Number.parseInt(program.port || envs.PORT || process.env.PORT || 5006)
    let baseport_i = 0
    let baseport_j = 0
    let envl = []

    config.processes = []

    // This is ugly because of shitty support for array copying
    // Cleanup is definitely required
    for (let key in req) {
      const c = {}
      const cmd = procs[key]

      if (!cmd) {
        display.Warn("Required Key '%s' Does Not Exist in Procfile Definition", key)
        continue
      }

      const n = req[key]

      config.processes.push({n, process: key})
      c.process = key
      c.command = cmd

      for (const _ in config) {
        c[_] = config[_]
      }

      c.numbers = []
      for (let i = 1; i <= n; i++) {
        const port = (baseport + baseport_i + baseport_j) * 100

        const envl = []
        for (key in envs) {
          envl.push({
            key,
            value: envs[key],
          })
        }

        envl.push({key: 'PORT', value: conf.port})
        // eslint-disable-next-line unicorn/no-array-push-push
        envl.push({key: 'FOREMAN_WORKER_NAME', value: conf.process + '.' + conf.number})

        conf.envs = envl

        const conf = {
          ...c,
          envs: envl,
          number: i,
          port,
        }

        // Write the APP-PROCESS-N.conf File
        writeout.foreman_app_n(conf, this.out)

        baseport_i++
        c.numbers.push({number: i})
      }

      envl = []
      for (key in envs) {
        envl.push({
          key,
          value: envs[key],
        })
      }

      c.envs = envl

      // Write the APP-Process.conf File
      writeout.foreman_app(c, this.out)

      baseport_i = 0
      baseport_j++
    }

    // Write the APP.conf File
    writeout.foreman(config, this.out)
  })

program.parse(process.argv)

if (process.argv.slice(2).length === 0) {
  console.log(colors.cyan('   _____                           '))
  console.log(colors.cyan('  |   __|___ ___ ___ _____ ___ ___ '))
  console.log(colors.yellow('  |   __| . |  _| -_|     |   |   |'))
  console.log(colors.magenta('  |__|  |___|_| |___|_|_|_|_^_|_|_|'))
  program.outputHelp()
  process.exit(1)
}
