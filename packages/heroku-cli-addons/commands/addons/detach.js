'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let app = context.app
  let attachment = yield heroku.get(`/apps/${app}/addon-attachments/${context.args.attachment_name}`)

  yield cli.action(
    `Detaching ${cli.color.attachment(attachment.name)} to ${cli.color.addon(attachment.addon.name)} from ${cli.color.app(app)}`,
    heroku.request({
      path: `/addon-attachments/${attachment.id}`,
      method: 'DELETE'
    })
  )

  yield cli.action(
    `Unsetting ${cli.color.attachment(attachment.name)} config vars and restarting ${cli.color.app(app)}`,
    {success: false},
    co(function * () {
      let releases = yield heroku.request({
        path: `/apps/${app}/releases`,
        partial: true,
        headers: { 'Range': 'version ..; max=1, order=desc' }
      })
      cli.action.done(`done, v${releases[0].version}`)
    })
  )
}

module.exports = {
  topic: 'addons',
  command: 'detach',
  description: 'detach an add-on resource from an app',
  needsAuth: true,
  needsApp: true,
  args: [{name: 'attachment_name'}],
  run: cli.command({preauth: true}, co.wrap(run))
}
