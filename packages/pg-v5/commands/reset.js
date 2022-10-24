'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  const host = require('../lib/host')
  const fetcher = require('../lib/fetcher')(heroku)
  let { app, args, flags } = context
  let db = await fetcher.addon(app, args.database)
  let extensions = flags.extensions
  if (extensions) {
    extensions = extensions.split(',').map(ext => ext.trim().toLowerCase()).sort()
  }

  await cli.confirmApp(app, flags.confirm, `WARNING: Destructive action
${cli.color.addon(db.name)} will lose all of its data
`)

  await cli.action(`Resetting ${cli.color.addon(db.name)}`, async function () {
    await heroku.put(`/client/v11/databases/${db.id}/reset`, {
      body: { extensions: extensions },
      host: host(db)
    })
  }())
}

module.exports = {
  topic: 'pg',
  command: 'reset',
  description: 'delete all data in DATABASE',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'database', optional: true }],
  flags: [
    { name: 'extensions', char: 'e', hasValue: true, description: 'comma-separated list of extensions to pre-install in the public schema' },
    { name: 'confirm', char: 'c', hasValue: true }
  ],
  run: cli.command({ preauth: true }, run)
}
