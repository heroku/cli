'use strict'

let cli = require('heroku-cli-util')

async function run(context, heroku) {
  let app = context.app
  let attachment = await heroku.get(`/apps/${app}/addon-attachments/${context.args.attachment_name}`)

  await cli.action(
    `Detaching ${cli.color.attachment(attachment.name)} to ${cli.color.addon(attachment.addon.name)} from ${cli.color.app(app)}`,
    heroku.request({
      path: `/addon-attachments/${attachment.id}`,
      method: 'DELETE'
    })
  )

  await cli.action(
    `Unsetting ${cli.color.attachment(attachment.name)} config vars and restarting ${cli.color.app(app)}`,
    { success: false },
    async function () {
      let releases = await heroku.request({
        path: `/apps/${app}/releases`,
        partial: true,
        headers: { 'Range': 'version ..; max=1, order=desc' }
      })
      cli.action.done(`done, v${releases[0].version}`)
    }()
  )
}

module.exports = {
  topic: 'addons',
  command: 'detach',
  description: 'detach an existing add-on resource from an app',
  needsAuth: true,
  needsApp: true,
  args: [{ name: 'attachment_name' }],
  run: cli.command({ preauth: true }, run)
}
