'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  const host = require('../../lib/host')
  const fetcher = require('../../lib/fetcher')(heroku)
  const util = require('../../lib/util')
  const {app, args, flags} = context
  let db = await fetcher.addon(app, args.database)
  let all = flags.all
  let warnings = []
  let cred = flags.name || 'default'

  if (all && flags.name !== undefined) {
    throw new Error('cannot pass both --all and --name')
  }

  if (util.essentialNumPlan(db) || (util.legacyEssentialPlan(db) && cred !== 'default')) {
    throw new Error("You can't rotate credentials on Essential-tier databases.")
  }

  if (all && flags.force) {
    warnings.push('This forces rotation on all credentials including the default credential.')
  }

  let attachments = await heroku.get(`/addons/${db.name}/addon-attachments`)
  if (flags.name) {
    attachments = attachments.filter(a => a.namespace === `credential:${cred}`)
  }

  if (!flags.all) {
    warnings.push(`The password for the ${cred} credential will rotate.`)
  }

  if (flags.all || flags.force || cred === 'default') {
    warnings.push('Connections will be reset and applications will be restarted.')
  } else {
    warnings.push('Connections older than 30 minutes will be reset, and a temporary rotation username will be used during the process.')
  }

  if (flags.force) {
    warnings.push(`Any followers lagging in replication (see ${cli.color.cmd('heroku pg:info')}) will be inaccessible until caught up.`)
  }

  if (attachments.length > 0) {
    warnings.push(`This command will affect the app${(attachments.length > 1) ? 's' : ''} ${[...new Set(attachments.map(c => cli.color.app(c.app.name)))].sort().join(', ')}.`)
  }

  await cli.confirmApp(app, flags.confirm, `WARNING: Destructive Action
${warnings.join('\n')}`)

  let body = flags.force ? {host: host(db), forced: true} : {host: host(db)}
  if (all) {
    await cli.action(`Rotating all credentials on ${cli.color.addon(db.name)}`, (async function () {
      await heroku.post(`/postgres/v0/databases/${db.name}/credentials_rotation`,
        body)
    })())
  } else {
    await cli.action(`Rotating ${cred} on ${cli.color.addon(db.name)}`, (async function () {
      await heroku.post(`/postgres/v0/databases/${db.name}/credentials/${encodeURIComponent(cred)}/credentials_rotation`,
        body)
    })())
  }
}

module.exports = {
  topic: 'pg',
  command: 'credentials:rotate',
  description: 'rotate the database credentials',
  needsApp: true,
  needsAuth: true,
  flags: [
    {name: 'name', char: 'n', description: 'which credential to rotate (default credentials if not specified)', hasValue: true},
    {name: 'all', description: 'rotate all credentials', hasValue: false},
    {name: 'confirm', char: 'c', hasValue: true},
    {name: 'force', description: 'forces rotating the targeted credentials', hasValue: false},
  ],
  args: [{name: 'database', optional: true}],
  run: cli.command({preauth: true}, run),
}
