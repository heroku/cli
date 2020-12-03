'use strict'

const co = require('co')
const bastion = require('./bastion')
const debug = require('./debug')
const { once, EventEmitter } = require('events')

function psqlQueryOptions (query, dbEnv) {
  debug('Running query: %s', query.trim())

  const psqlArgs = ['-c', query, '--set', 'sslmode=require']

  const childProcessOptions = {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit']
  }

  return {
    dbEnv,
    psqlArgs,
    childProcessOptions,
    pipeToStdout: true
  }
}

function psqlFileOptions (file, dbEnv) {
  debug('Running sql file: %s', file.trim())

  const childProcessOptions = {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit']
  }

  const psqlArgs = ['-f', file, '--set', 'sslmode=require']

  return {
    dbEnv,
    psqlArgs,
    childProcessOptions,
    pipeToStdout: true
  }
}

function psqlInteractiveOptions (prompt, dbEnv) {
  let psqlArgs = ['--set', `PROMPT1=${prompt}`, '--set', `PROMPT2=${prompt}`]
  let psqlHistoryPath = process.env.HEROKU_PSQL_HISTORY
  if (psqlHistoryPath) {
    const fs = require('fs')
    const path = require('path')
    if (fs.existsSync(psqlHistoryPath) && fs.statSync(psqlHistoryPath).isDirectory()) {
      let appLogFile = `${psqlHistoryPath}/${prompt.split(':')[0]}`
      debug('Logging psql history to %s', appLogFile)
      psqlArgs = psqlArgs.concat(['--set', `HISTFILE=${appLogFile}`])
    } else if (fs.existsSync(path.dirname(psqlHistoryPath))) {
      debug('Logging psql history to %s', psqlHistoryPath)
      psqlArgs = psqlArgs.concat(['--set', `HISTFILE=${psqlHistoryPath}`])
    } else {
      const cli = require('heroku-cli-util')
      cli.warn(`HEROKU_PSQL_HISTORY is set but is not a valid path (${psqlHistoryPath})`)
    }
  }
  psqlArgs = psqlArgs.concat(['--set', 'sslmode=require'])

  const childProcessOptions = {
    stdio: 'inherit'
  }

  return {
    dbEnv,
    psqlArgs,
    childProcessOptions
  }
}

function execPSQL ({ dbEnv, psqlArgs, childProcessOptions, pipeToStdout }) {
  const { spawn } = require('child_process')

  const options = {
    env: dbEnv,
    ...childProcessOptions
  }

  const psql = spawn('psql', psqlArgs, options)

  if (pipeToStdout) {
    psql.stdout.pipe(process.stdout)
  }

  return psql
}

async function waitForPSQLExit (psql) {
  try {
    const exitCode = await once(psql, 'close')
    debug(`psql exited with code ${exitCode}`)
    if (exitCode > 0) {
      throw new Error(`psql exited with code ${exitCode}`)
    }
  } catch (err) {
    debug('psql error', err)
    let error = err

    if (error.code === 'ENOENT') {
      error = new Error(`The local psql command could not be located. For help installing psql, see https://devcenter.heroku.com/articles/heroku-postgresql#local-setup`)
    }

    throw error
  }
}

// According to node.js docs, sending a kill to a process won't cause an error
// but could have unintended consequences if the PID gets reassigned:
// https://nodejs.org/docs/latest-v14.x/api/child_process.html#child_process_subprocess_kill_signal
// To be on the safe side, check if the process was already killed before sending the signal
function killUnlessDead (childProcess, signal) {
  if (!childProcess.killed) {
    childProcess.kill(signal)
  }
}

// trap SIGINT so that ctrl+c can be used by psql without killing the
// parent node process.
// you can use ctrl+c in psql to kill running queries
// while keeping the psql process open.
// This code is to stop the parent node process (heroku CLI)
// from exiting. If the parent Heroku CLI node process exits, then psql will exit as it
// is a child process of the Heroku CLI node process.
const trapAndForwardSignalsToChildProcess = (childProcess) => {
  const signalsToTrap = ['SIGINT']
  const signalTraps = signalsToTrap.map((signal) => {
    process.removeAllListeners(signal);
    const listener = () => killUnlessDead(childProcess, signal)
    process.on(signal, listener)
    return [signal, listener]
  });

  const cleanup = () => {
    signalTraps.forEach(([signal, listener]) => {
      process.removeListener(signal, listener)
    })
  }

  return cleanup
}

async function runWithTunnel (db, tunnelConfig, options) {
  const tunnel = await Tunnel.connect(db, tunnelConfig)

  const psql = execPSQL(options)
  const cleanupSignalTraps = trapAndForwardSignalsToChildProcess(psql)

  try {
    await Promise.race([
      waitForPSQLExit(psql),
      tunnel.waitForClose()
    ])
  } finally {
    cleanupSignalTraps()
    tunnel.close()
    killUnlessDead(psql, 'SIGKILL')
  }
}

class Tunnel {
  constructor (tunnel) {
    this.tunnel = tunnel
    this.events = new EventEmitter()
  }

  async waitForClose () {
    if (this.tunnel) {
      try {
        await once(this.tunnel, 'close')
      } catch (err) {
        debug(err)
        throw new Error('Secure tunnel to your database failed')
      }
    } else {
      await once(this.events, 'close')
    }
  }

  close () {
    if (this.tunnel) {
      this.tunnel.close()
    } else {
      this.events.emit('close', 0)
    }
  }

  static async connect (db, tunnelConfig) {
    const tunnel = await bastion.sshTunnel(db, tunnelConfig)
    return new Tunnel(tunnel)
  }
}

function * exec (db, query) {
  let configs = bastion.getConfigs(db)
  const options = psqlQueryOptions(query, configs.dbEnv)

  return runWithTunnel(db, configs.dbTunnelConfig, options)
}

async function execFile (db, file) {
  const configs = bastion.getConfigs(db)
  const options = psqlFileOptions(file, configs.dbEnv)

  return runWithTunnel(db, configs.dbTunnelConfig, options)
}

function * interactive (db) {
  let name = db.attachment.name
  let prompt = `${db.attachment.app.name}::${name}%R%# `
  let configs = bastion.getConfigs(db)
  configs.dbEnv.PGAPPNAME = 'psql interactive' // default was 'psql non-interactive`
  const options = psqlInteractiveOptions(prompt, configs.dbEnv)

  return runWithTunnel(db, configs.dbTunnelConfig, options)
}

module.exports = {
  exec: co.wrap(exec),
  execFile: execFile,
  interactive: co.wrap(interactive)
}
