'use strict'

const cli = require('heroku-cli-util')
const {sortBy} = require('lodash')
const util = require('../lib/util')

async function run(context, heroku) {
  const fetcher = require('../lib/fetcher')(heroku)

  const {app, args, flags} = context

  let showCredentials = async function () {
    const host = require('../lib/host')
    let addon = await fetcher.addon(app, args.database)
    let attachments = []
    let credentials = []

    if (util.essentialNumPlan(addon)) {
      throw new Error('You can’t perform this operation on Essential-tier databases.')
    }

    function presentCredential(cred) {
      let credAttachments = []
      if (cred !== 'default') {
        credAttachments = attachments.filter(a => a.namespace === `credential:${cred}`)
      } else {
        credAttachments = attachments.filter(a => a.namespace === null)
      }

      return util.presentCredentialAttachments(app, credAttachments, credentials, cred)
    }

    credentials = await heroku.get(`/postgres/v0/databases/${addon.name}/credentials`,
      {host: host(addon)})
    let isDefaultCredential = cred => cred.name !== 'default'
    credentials = sortBy(credentials, isDefaultCredential, 'name')
    attachments = await heroku.get(`/addons/${addon.name}/addon-attachments`)

    cli.warn(`${cli.color.cmd('pg:credentials')} has recently changed. Please use ${cli.color.cmd('pg:credentials:url')} for the previous output.`)
    cli.table(credentials, {
      columns: [
        {key: 'name', label: 'Credential', format: presentCredential},
        {key: 'state', label: 'State'},
      ],
    })
  }

  await showCredentials()
}

module.exports = {
  topic: 'pg',
  command: 'credentials',
  description: 'show information on credentials in the database',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  run: cli.command({preauth: true}, run),
}
