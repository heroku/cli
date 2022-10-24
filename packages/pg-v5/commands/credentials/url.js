'use strict'

const cli = require('heroku-cli-util')
const url = require('url')

async function run(context, heroku) {
  const host = require('../../lib/host')
  const fetcher = require('../../lib/fetcher')(heroku)
  const util = require('../../lib/util')

  const { app, args, flags } = context

  let db = await fetcher.addon(app, args.database)
  let cred = flags.name || 'default'
  if (util.essentialPlan(db) && cred !== 'default') {
    throw new Error('Essential-tier databases support only one default credential.')
  }
  let credInfo = await heroku.get(`/postgres/v0/databases/${db.name}/credentials/${encodeURIComponent(cred)}`,
    { host: host(db) })

  let activeCreds = credInfo.credentials.find((c) => c.state === 'active')
  if (!activeCreds) {
    cli.exit(1, `could not find any active credentials for ${cred}`)
  }

  let creds = Object.assign({}, db, {
    database: credInfo.database,
    host: credInfo.host,
    port: credInfo.port
  }, {
    user: activeCreds.user,
    password: activeCreds.password
  })

  let connUrl = url.format({
    pathname: `/${creds.database}`,
    host: `${creds.host}:${creds.port}`,
    auth: `${creds.user}:${creds.password}`,
    protocol: 'postgres:',
    slashes: true
  })
  cli.log(`Connection information for ${cred} credential.
Connection info string:
   "dbname=${creds.database} host=${creds.host} port=${creds.port} user=${creds.user} password=${creds.password} sslmode=require"
Connection URL:
   ${connUrl}`)
}

module.exports = {
  topic: 'pg',
  command: 'credentials:url',
  description: 'show information on a database credential',
  needsApp: true,
  needsAuth: true,
  flags: [
    { name: 'name', char: 'n', description: 'which credential to show (default credentials if not specified)', hasValue: true }
  ],
  args: [{ name: 'database', optional: true }],
  run: cli.command({ preauth: true }, run)
}
