'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  const fetcher = require('../lib/fetcher')(heroku)
  const psql = require('../lib/psql')

  const { app, args, flags } = context

  const namespace = flags.credential ? `credential:${flags.credential}` : null
  let db
  try {
    db = await fetcher.database(app, args.database, namespace)
  } catch (err) {
    if (namespace && err.message === 'Couldn\'t find that addon.') {
      throw new Error('Credential doesn\'t match, make sure credential is attached')
    }
    throw err
  }
  cli.console.error(`--> Connecting to ${cli.color.addon(db.attachment.addon.name)}`)
  if (flags.command) {
    const output = await psql.exec(db, flags.command)
    process.stdout.write(output)
  } else if (flags.file) {
    const output = await psql.execFile(db, flags.file)
    process.stdout.write(output)
  } else {
    await psql.interactive(db)
  }
}

const cmd = {
  description: 'open a psql shell to the database',
  needsApp: true,
  needsAuth: true,
  flags: [
    { name: 'command', char: 'c', description: 'SQL command to run', hasValue: true },
    { name: 'file', char: 'f', description: 'SQL file to run', hasValue: true },
    { name: 'credential', description: 'credential to use', hasValue: true }
  ],
  args: [{ name: 'database', optional: true }],
  run: cli.command({ preauth: true }, run)
}

module.exports = [
  Object.assign({ topic: 'pg', command: 'psql' }, cmd),
  Object.assign({ topic: 'psql' }, cmd)
]
