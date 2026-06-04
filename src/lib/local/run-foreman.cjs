// Copyright IBM Corp. 2012,2015. All Rights Reserved.
// Node module: foreman
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

// Based on the Node Foreman package (v3.0.1). The foreman library is vendored
// in ./foreman/ and is no longer an external npm dependency. The default port
// was changed from 5000 to 5006 to avoid conflicts with macOS AirPlay.

// These rules are disabled in order to prevent the need for refactoring
/* eslint-disable guard-for-in */
/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable  no-undef */
/* eslint-disable n/no-process-exit */
/* eslint-disable unicorn/no-process-exit */
/* eslint-disable no-new */
/* eslint-disable radix */
/* eslint-disable perfectionist/sort-imports */

const program = require('commander')
const colors = require('./foreman/colors.cjs')
const events = require('node:events')
const {quote} = require('shell-quote')
const display = require('./foreman/console.cjs').Console
const _envs    = require('./foreman/envs.cjs')
const {startForward} = require('./foreman/forward.cjs')
const _proc = require('./foreman/proc.cjs')
const _procfile = require('./foreman/procfile.cjs')
const {startProxies} = require('./foreman/proxy.cjs')
const _requirements    = require('./foreman/requirements.cjs')

program.version('3.0.1')
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

program.parse(process.argv)

if (process.argv.slice(2).length === 0) {
  console.log(colors.cyan('   _____                           '))
  console.log(colors.cyan('  |   __|___ ___ ___ _____ ___ ___ '))
  console.log(colors.yellow('  |   __| . |  _| -_|     |   |   |'))
  console.log(colors.magenta('  |__|  |___|_| |___|_|_|_|_^_|_|_|'))
  program.outputHelp()
  process.exit(1)
}
