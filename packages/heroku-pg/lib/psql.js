'use strict'

const co = require('co')
const debug = require('debug')('psql')

function * exec (db, query) {
  const execa = require('execa')
  const cli = require('heroku-cli-util')

  debug(query)
  let env = {
    PGAPPNAME: 'psql non-interactive',
    PGUSER: db.user,
    PGPASSWORD: db.password,
    PGDATABASE: db.database,
    PGPORT: db.port,
    PGHOST: db.host
  }
  try {
    let {stdout, stderr} = yield execa('psql', ['-c', query], {env})
    process.stderr.write(stderr)
    return stdout
  } catch (err) {
    if (err.code !== 127) throw err
    cli.error(`The local psql command could not be located.
For help installing psql, see https://devcenter.heroku.com/articles/heroku-postgresql#local-setup`)
    process.exit(1)
  }
}

module.exports = {
  exec: co.wrap(exec)
}
