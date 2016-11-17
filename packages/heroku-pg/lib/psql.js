'use strict'

const co = require('co')
const debug = require('debug')('psql')

function handleError (err) {
  const cli = require('heroku-cli-util')
  if (!err) return
  if (err.code !== 'ENOENT') throw err
  cli.error(`The local psql command could not be located.
For help installing psql, see https://devcenter.heroku.com/articles/heroku-postgresql#local-setup`)
  process.exit(1)
}

function env (db) {
  return Object.assign({}, process.env, {
    PGAPPNAME: 'psql non-interactive',
    PGSSLMODE: db.hostname === 'localhost' ? 'prefer' : 'require',
    PGUSER: db.user || '',
    PGPASSWORD: db.password,
    PGDATABASE: db.database,
    PGPORT: db.port || 5432,
    PGHOST: db.host
  })
}

function handleSignals () {
  process.once('SIGINT', () => {})
}

function * exec (db, query) {
  const stripEOF = require('strip-eof')
  const {spawnSync} = require('child_process')
  handleSignals()
  debug(query)
  let {stdout, error: err, status} = spawnSync('psql', ['--command', query], {env: env(db), encoding: 'utf8', stdio: [0, 'pipe', 2]})
  handleError(err)
  if (status !== 0) process.exit(status)
  return stripEOF(stdout)
}

function * interactive (db) {
  const {spawnSync} = require('child_process')
  let name = db.addon.config_vars[0].replace(/^HEROKU_POSTGRESQL_/, '').replace(/_URL$/, '')
  let prompt = `${db.addon.app.name}::${name}%R%# `
  handleSignals()
  let {error: err, status} = spawnSync('psql',
    ['--set', `PROMPT1=${prompt}`, '--set', `PROMPT2=${prompt}`],
    {env: env(db), stdio: 'inherit'})
  handleError(err)
  if (status !== 0) process.exit(status)
}

module.exports = {
  exec: co.wrap(exec),
  interactive: co.wrap(interactive)
}
