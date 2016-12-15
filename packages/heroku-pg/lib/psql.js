'use strict'

const co = require('co')
const bastion = require('./bastion')

function handlePsqlError (reject, psql) {
  psql.on('error', (err) => {
    if (err.code === 'ENOENT') {
      reject(`The local psql command could not be located. For help installing psql, see https://devcenter.heroku.com/articles/heroku-postgresql#local-setup`)
    } else {
      reject(err)
    }
  })
}

function execPsql (query, dbEnv, timeout) {
  const {spawn} = require('child_process')
  return new Promise((resolve, reject) => {
    let timer = setTimeout(() => reject('psql call timed out'), timeout)
    let result = ''
    let psql = spawn('psql', ['-c', query], {env: dbEnv, encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'inherit' ]})
    psql.stdout.on('data', function (data) {
      result += data.toString()
    })
    psql.on('close', function (code) {
      clearTimeout(timer)
      resolve(result)
    })
    handlePsqlError(reject, psql)
  })
}

function psqlInteractive (dbEnv, prompt, timeout) {
  const {spawn} = require('child_process')
  return new Promise((resolve, reject) => {
    let psql = spawn('psql',
                     ['--set', `PROMPT1=${prompt}`, '--set', `PROMPT2=${prompt}`],
                     {env: dbEnv, stdio: 'inherit'})
    handlePsqlError(reject, psql)
    psql.on('close', (data) => {
      resolve()
    })
  })
}

function handleSignals () {
  process.on('SIGINT', () => {})
}

function * exec (db, query, timeout = 20000) {
  handleSignals()
  let configs = bastion.getConfigs(db)

  yield bastion.sshTunnel(db, configs.dbTunnelConfig, timeout)
  return yield execPsql(query, configs.dbEnv, timeout)
}

function * interactive (db) {
  const pgUtil = require('./util')
  let name = pgUtil.getUrl(db.attachment.config_vars).replace(/^HEROKU_POSTGRESQL_/, '').replace(/_URL$/, '')
  let prompt = `${db.attachment.app.name}::${name}%R%# `
  handleSignals()
  let configs = bastion.getConfigs(db)

  yield bastion.sshTunnel(db, configs.dbTunnelConfig)
  return yield psqlInteractive(configs.dbEnv, prompt)
}

module.exports = {
  exec: co.wrap(exec),
  interactive: co.wrap(interactive)
}
