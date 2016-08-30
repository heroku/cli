'use strict'

const co = require('co')
const debug = require('debug')('psql')

function * exec (db, query) {
  const stripEOF = require('strip-eof')
  const {spawnSync} = require('child_process')
  const cli = require('heroku-cli-util')

  debug(query)
  let env = Object.assign({}, process.env, {
    PGAPPNAME: 'psql non-interactive',
    PGSSLMODE: 'require',
    PGUSER: db.user,
    PGPASSWORD: db.password,
    PGDATABASE: db.database,
    PGPORT: db.port,
    PGHOST: db.host
  })
  let {stdout, error: err, status} = spawnSync('psql', ['--command', query], {env, encoding: 'utf8', stdio: [0, 'pipe', 2]})
  if (err) {
    if (err.code !== 'ENOENT') throw err
    cli.error(`The local psql command could not be located.
For help installing psql, see https://devcenter.heroku.com/articles/heroku-postgresql#local-setup`)
    process.exit(1)
  }
  if (status !== 0) process.exit(status)
  return stripEOF(stdout)
}

module.exports = {
  exec: co.wrap(exec)
}
