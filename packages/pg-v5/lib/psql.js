'use strict'

const co = require('co')
const bastion = require('./bastion')
const debug = require('./debug')

function handlePsqlError (reject, psql) {
  psql.on('error', (err) => {
    if (err.code === 'ENOENT') {
      reject(`The local psql command could not be located. For help installing psql, see https://devcenter.heroku.com/articles/heroku-postgresql#local-setup`)
    } else {
      reject(err)
    }
  })
}

function execPsql (query, dbEnv) {
  const { spawn } = require('child_process')
  return new Promise((resolve, reject) => {
    let result = ''
    debug('Running query: %s', query.trim())
    let psql = spawn('psql', ['-c', query, '--set', 'sslmode=require'], { env: dbEnv, encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'inherit' ] })
    psql.stdout.on('data', function (data) {
      result += data.toString()
    })
    psql.on('close', function (code) {
      resolve(result)
    })
    handlePsqlError(reject, psql)
  })
}

function execPsqlWithFile (file, dbEnv) {
  const { spawn } = require('child_process')
  return new Promise((resolve, reject) => {
    let result = ''
    debug('Running sql file: %s', file.trim())
    let psql = spawn('psql', ['-f', file, '--set', 'sslmode=require'], { env: dbEnv, encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'inherit' ] })
    psql.stdout.on('data', function (data) {
      result += data.toString()
    })
    psql.on('close', function (code) {
      resolve(result)
    })
    handlePsqlError(reject, psql)
  })
}

function psqlInteractive (dbEnv, prompt) {
  const { spawn } = require('child_process')
  return new Promise((resolve, reject) => {
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

    let psql = spawn('psql', psqlArgs, { env: dbEnv, stdio: 'inherit' })
    handlePsqlError(reject, psql)
    psql.on('close', (data) => {
      resolve()
    })
  })
}

function handleSignals () {
  process.removeAllListeners('SIGINT')
  process.on('SIGINT', () => {})
}

function * exec (db, query) {
  handleSignals()
  let configs = bastion.getConfigs(db)

  yield bastion.sshTunnel(db, configs.dbTunnelConfig)
  return yield execPsql(query, configs.dbEnv)
}

async function execFile (db, file) {
  handleSignals()
  let configs = bastion.getConfigs(db)

  await bastion.sshTunnel(db, configs.dbTunnelConfig)
  return execPsqlWithFile(file, configs.dbEnv)
}

function * interactive (db) {
  let name = db.attachment.name
  let prompt = `${db.attachment.app.name}::${name}%R%# `
  handleSignals()
  let configs = bastion.getConfigs(db)
  configs.dbEnv.PGAPPNAME = 'psql interactive' // default was 'psql non-interactive`

  yield bastion.sshTunnel(db, configs.dbTunnelConfig)
  return yield psqlInteractive(configs.dbEnv, prompt)
}

module.exports = {
  exec: co.wrap(exec),
  execFile: execFile,
  interactive: co.wrap(interactive)
}
