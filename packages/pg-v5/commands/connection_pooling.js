'use strict'

const cli = require('heroku-cli-util')
const host = require('../lib/host')

async function run(context, heroku) {
  const util = require('../lib/util')
  const fetcher = require('../lib/fetcher')(heroku)
  const {app, args, flags} = context

  let db = await fetcher.addon(app, args.database)
  let addon = await heroku.get(`/addons/${encodeURIComponent(db.name)}`)

  if (util.essentialPlan(db)) throw new Error('You can’t perform this operation on Essential-tier databases.')

  let attachment = await cli.action(
    `Enabling Connection Pooling on ${cli.color.addon(addon.name)} to ${cli.color.app(app)}`,
    heroku.post(`/client/v11/databases/${encodeURIComponent(db.name)}/connection-pooling`, {
      body: {name: flags.as, credential: 'default', app: app},
      host: host(),
    }),
  )

  await cli.action(
    `Setting ${cli.color.attachment(attachment.name)} config vars and restarting ${cli.color.app(app)}`,
    {success: false},
    (async function () {
      let releases = await heroku.get(`/apps/${app}/releases`, {
        partial: true,
        headers: {Range: 'version ..; max=1, order=desc'},
      })
      cli.action.done(`done, v${releases[0].version}`)
    })(),
  )
}

module.exports = {
  topic: 'pg',
  command: 'connection-pooling:attach',
  description: 'add an attachment to a database using connection pooling',
  needsApp: true,
  needsAuth: true,
  help: `Example:

  heroku pg:connection-pooling:attach postgresql-something-12345
`,
  args: [{name: 'database', optional: true}],
  flags: [
    {name: 'as', description: 'name for add-on attachment', hasValue: true},
  ],
  run: cli.command({preauth: true}, run),
}
