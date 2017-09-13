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
  const {spawn} = require('child_process')
  return new Promise((resolve, reject) => {
    let result = ''
    debug('Running query: %s', query.trim())
    let psql = spawn('psql', ['-c', query], {env: dbEnv, encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'inherit' ]})
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
  process.removeAllListeners('SIGINT')
  process.on('SIGINT', () => {})
}

function * exec (db, query) {
  handleSignals()
  let configs = bastion.getConfigs(db)

  yield bastion.sshTunnel(db, configs.dbTunnelConfig)
  return yield execPsql(query, configs.dbEnv)
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
