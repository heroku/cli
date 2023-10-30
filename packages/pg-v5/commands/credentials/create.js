'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  const fetcher = require('../../lib/fetcher')(heroku)
  const host = require('../../lib/host')
  const util = require('../../lib/util')

  const {app, args, flags} = context

  let db = await fetcher.addon(app, args.database)
  if (util.essentialPlan(db)) throw new Error("You can't create a custom credential on Essential-tier databases.")

  let data = {
    name: flags.name,
  }
  await cli.action(`Creating credential ${cli.color.cmd(flags.name)}`, (async function () {
    await heroku.post(`/postgres/v0/databases/${db.name}/credentials`, {host: host(db), body: data})
  })())
  let attachCmd = `heroku addons:attach ${db.name} --credential ${flags.name} -a ${app}`
  let psqlCmd = `heroku pg:psql ${db.name} -a ${app}`
  cli.log(`
Please attach the credential to the apps you want to use it in by running ${cli.color.cmd(attachCmd)}.
Please define the new grants for the credential within Postgres: ${cli.color.cmd(psqlCmd)}.`)
}

module.exports = {
  topic: 'pg',
  command: 'credentials:create',
  description: 'create credential within database',
  needsApp: true,
  needsAuth: true,
  help: `Example:

    heroku pg:credentials:create postgresql-something-12345 --name new-cred-name
`,
  args: [{name: 'database', optional: true}],
  flags: [{name: 'name', char: 'n', hasValue: true, required: true, description: 'name of the new credential within the database'}],
  run: cli.command({preauth: true}, run),
}
