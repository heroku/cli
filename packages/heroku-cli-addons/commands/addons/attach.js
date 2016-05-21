'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let app = context.app
  let addon = yield heroku.get(`/addons/${context.args.addon_name}`)

  function createAttachment (app, as, confirm) {
    return cli.action(
      `Attaching ${cli.color.addon(addon.name)}${as ? ' as ' + cli.color.attachment(as) : ''} to ${cli.color.app(app)}`,
      heroku.request({
        path: '/addon-attachments',
        method: 'POST',
        body: {
          name: as,
          app: {name: app},
          addon: {name: addon.name},
          confirm
        }
      })
    )
  }

  let attachment = yield createAttachment(app, context.flags.as, context.flags.confirm)
    .catch((err) => {
      if (!err.body || err.body.id !== 'confirmation_required') throw err
      return cli.confirmApp(app, context.flags.confirm, err.body.message)
        .then(() => createAttachment(app, context.flags.as, app))
    })
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
  description: 'attach add-on resource to a new app',
  needsAuth: true,
  needsApp: true,
  flags: [
    {name: 'as', description: 'name for add-on attachment', hasValue: true},
    {name: 'confirm', description: 'overwrite existing add-on attachment with same name', hasValue: true}
  ],
  args: [{name: 'addon_name'}],
  run: cli.command({preauth: true}, co.wrap(run))
}
