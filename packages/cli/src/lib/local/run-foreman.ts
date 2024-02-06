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

const path = require('path')
const events = require('events')
const fs = require('fs')
const quote = require('shell-quote').quote
const program = require('commander')
const colors = require('foreman/lib/colors')
const display = require('foreman/lib/console').Console
const _proc = require('foreman/lib/proc')
const _procfile = require('foreman/lib/procfile')
const _envs    = require('foreman/lib/envs')
const _requirements    = require('foreman/lib/requirements')
const startProxies = require('foreman/lib/proxy').startProxies
const startForward = require('foreman/lib/forward').startForward
const exporters = require('foreman/lib/exporters')
const foremanPjson = require('foreman/package.json')

program.version(foremanPjson.version)
program.option('-j, --procfile <FILE>', 'load procfile FILE', 'Procfile')
program.option('-e, --env      <FILE>', 'load environment from FILE, a comma-separated list', '.env')
program.option('-p, --port     <PORT>', 'start indexing ports at number PORT', 0)

// Foreman Event Bus/Emitter //

const emitter = new events.EventEmitter()
emitter.once('killall', function (signal: any) {
  display.Done('Killing all processes with signal ', signal)
})
emitter.setMaxListeners(50)

const start = _proc.start
const once  = _proc.once

const loadProc  = _procfile.loadProc

const loadEnvs = _envs.loadEnvs

const getreqs          = _requirements.getreqs
const calculatePadding = _requirements.calculatePadding

// Kill All Child Processes on SIGINT
process.once('SIGINT', function () {
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
  .action(function (this:any, args: any) {
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
      display.wrapline = process.stdout.columns ? process.stdout.columns - display.padding - 7 : 0
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
  .action(function (this: any, args: string | any[]) {
    const envs = loadEnvs(program.env)

    const callback = function (code: number | undefined) {
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

    display.trimline = process.stdout.columns ? process.stdout.columns - 5 : 0

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
  .action(function (this: any, procArgs: any) {
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
      user: this.user,
      logs: this.log,
      envs: envs,
      group: this.gid || this.user,
      template: this.template,
      processes: [{}],
      envfile: path.resolve(program.env),
    }

    let writeout
    if (exporters[this.type]) {
      writeout = exporters[this.type]
    } else {
      display.Error('Unknown Export Format', this.type)
      process.exit(1)
    }

    // Check for Upstart User
    // friendly warning - does not stop export
    let userExists = false
    fs.readFileSync('/etc/passwd')
      .toString().split(/\n/).forEach(function (line: { match: (arg0: RegExp) => any[] }) {
        if (line.match(/^[^:]*/)[0] === config.user) {
          userExists = true
        }
      })

    if (!userExists) {
      display.Warn(display.fmt('User %s Does Not Exist on System', config.user))
    }

    // using port 5006 because it is not known to be used by other common software
    const baseport = Number.parseInt(program.port || envs.PORT || process.env.PORT || 5006)
    let baseport_i = 0
    let baseport_j = 0
    let envl = []

    // This is ugly because of shitty support for array copying
    // Cleanup is definitely required
    for (let key in req) {
      const cmd = procs[key]

      if (!cmd) {
        display.Warn("Required Key '%s' Does Not Exist in Procfile Definition", key)
        continue
      }

      const n = req[key]

      config.processes.push({process: key, n: n})
      const c = {
        ...config,
        process: key,
        command: cmd,
        numbers: [{}],
      }

      for (let i = 1; i <= n; i++) {
        const conf = {
          ...c,
          number: i,
          port: (baseport + baseport_i + baseport_j) * 100,
        }

        envl = []
        for (key in envs) {
          envl.push({
            key: key,
            value: envs[key],
          })
        }

        envl.push({key: 'PORT', value: conf.port})
        // eslint-disable-next-line unicorn/no-array-push-push
        envl.push({key: 'FOREMAN_WORKER_NAME', value: conf.process + '.' + conf.number})

        conf.envs = envl

        // Write the APP-PROCESS-N.conf File
        writeout.foreman_app_n(conf, this.out)

        baseport_i++
        c.numbers.push({number: i})
      }

      envl = []
      for (key in envs) {
        envl.push({
          key: key,
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
