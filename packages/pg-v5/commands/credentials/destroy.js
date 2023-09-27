'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  const fetcher = require('../../lib/fetcher')(heroku)
  const host = require('../../lib/host')
  const util = require('../../lib/util')

  const {app, args, flags} = context
  let cred = flags.name

  if (cred === 'default') {
    throw new Error('Default credential cannot be destroyed.')
  }

  let db = await fetcher.addon(app, args.database)
  if (util.essentialPlan(db)) {
    throw new Error('Essential-tier databases support only one default credential.')
  }

  let attachments = await heroku.get(`/addons/${db.name}/addon-attachments`)
  let credAttachments = attachments.filter(a => a.namespace === `credential:${flags.name}`)
  let credAttachmentApps = Array.from(new Set(credAttachments.map(a => a.app.name)))
  if (credAttachmentApps.length > 0) throw new Error(`Credential ${flags.name} must be detached from the app${credAttachmentApps.length > 1 ? 's' : ''} ${credAttachmentApps.map(name => cli.color.app(name)).join(', ')} before destroying.`)

  await cli.confirmApp(app, flags.confirm, 'WARNING: Destructive action')

  await cli.action(`Destroying credential ${cli.color.cmd(cred)}`, (async function () {
    await heroku.delete(`/postgres/v0/databases/${db.name}/credentials/${encodeURIComponent(cred)}`, {host: host()})
  })())

  cli.log(`The credential has been destroyed within ${db.name}.`)
  cli.log(`Database objects owned by ${cred} will be assigned to the default credential.`)
}

module.exports = {
  topic: 'pg',
  command: 'credentials:destroy',
  description: 'destroy credential within database',
  needsApp: true,
  needsAuth: true,
  help: `Example:

    heroku pg:credentials:destroy postgresql-transparent-56874 --name cred-name -a woodstock-production
`,
  args: [{name: 'database', optional: true}],
  flags: [
    {name: 'name', char: 'n', hasValue: true, required: true, description: 'unique identifier for the credential'},
    {name: 'confirm', char: 'c', hasValue: true},
  ],
  run: cli.command({preauth: true}, run),
}
