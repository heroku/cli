'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  const util = require('../../lib/util')

  let app = context.app
  let addon = yield heroku.get(`/addons/${encodeURIComponent(context.args.addon_name)}`)

  function createAttachment (app, as, confirm, credential) {
    let body = {
      name: as,
      app: {name: app},
      addon: {name: addon.name},
      confirm
    }
    if (credential && credential !== 'default') {
      body.namespace = 'credential:' + credential
    }
    return cli.action(
      `Attaching ${credential ? cli.color.addon(credential) + ' of ' : ''}${cli.color.addon(addon.name)}${as ? ' as ' + cli.color.attachment(as) : ''} to ${cli.color.app(app)}`,
      heroku.request({
        path: '/addon-attachments',
        method: 'POST',
        body: body
      })
    )
  }

  if (context.flags.credential && context.flags.credential !== 'default') {
    let credentialConfig = yield heroku.get(`/addons/${addon.name}/config/credential:${encodeURIComponent(context.flags.credential)}`)
    if (credentialConfig.length === 0) {
      throw new Error(`Could not find credential ${context.flags.credential} for database ${addon.name}`)
    }
  }

  let attachment = yield util.trapConfirmationRequired(context.app, context.flags.confirm, (confirm) => createAttachment(app, context.flags.as, confirm, context.flags.credential))

  yield cli.action(
    `Setting ${cli.color.attachment(attachment.name)} config vars and restarting ${cli.color.app(app)}`,
    {success: false},
    co(function * () {
      let releases = yield heroku.get(`/apps/${app}/releases`, {
        partial: true,
        headers: { 'Range': 'version ..; max=1, order=desc' }
      })
      cli.action.done(`done, v${releases[0].version}`)
    })
  )
}

module.exports = {
  topic: 'addons',
  command: 'attach',
  description: 'attach an existing add-on resource to an app',
  needsAuth: true,
  needsApp: true,
  flags: [
    {name: 'as', description: 'name for add-on attachment', hasValue: true},
    {name: 'credential', description: 'credential name for scoped access to Heroku Postgres', hasValue: true},
    {name: 'confirm', description: 'overwrite existing add-on attachment with same name', hasValue: true}
  ],
  args: [{name: 'addon_name'}],
  run: cli.command({preauth: true}, co.wrap(run))
}
