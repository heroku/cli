'use strict'

let cli = require('heroku-cli-util')
let time = require('../../time')

async function run(context, heroku) {
  let app = context.app && !context.flags.all ? await heroku.get(`/apps/${context.app}`) : null
  let notifications = await heroku.request({ host: 'telex.heroku.com', path: '/user/notifications' })
  if (app) notifications = notifications.filter((n) => n.target.id === app.id)
  if (!context.flags.read) {
    notifications = notifications.filter((n) => !n.read)
    await Promise.all(notifications.map((n) => heroku.request({ host: 'telex.heroku.com', path: `/user/notifications/${n.id}`, method: 'PATCH', body: { read: true } })))
  }

  function displayNotifications (notifications) {
    let wrap = cli.linewrap(2, 80)
    let read = context.flags.read ? 'Read' : 'Unread'
    cli.styledHeader(app ? `${read} Notifications for ${cli.color.app(app.name)}` : `${read} Notifications`)
    for (let n of notifications) {
      cli.log(cli.color.yellow(`\n${n.title}\n`))
      cli.log(wrap(`${cli.color.dim(time.ago(new Date(n.created_at)))}\n${n.body}`))
      for (let followup of n.followup) {
        cli.log(wrap(`${cli.color.gray.dim(time.ago(new Date(followup.created_at)))}\n${followup.body}`))
      }
    }
  }

  if (context.flags.json) {
    cli.styledJSON(notifications)
    return
  }
  if (notifications.length === 0) {
    if (context.flags.read) {
      if (app) cli.warn(`You have no notifications on ${cli.color.green(app.name)}.\nRun heroku notifications --all to view notifications for all apps.`)
      else cli.warn('You have no notifications.')
    } else if (app) cli.warn(`No unread notifications on ${cli.color.green(app.name)}.\nRun ${cli.color.cmd('heroku notifications --all')} to view notifications for all apps.`)
    else cli.warn(`No unread notifications.\nRun ${cli.color.cmd('heroku notifications --read')} to view read notifications.`)
  } else displayNotifications(notifications)
}

module.exports = {
  topic: 'notifications',
  description: 'display notifications',
  needsAuth: true,
  wantsApp: true,
  flags: [
    { name: 'all', description: 'view all notifications (not just the ones for the current app)' },
    { name: 'json', description: 'output in json format' },
    { name: 'read', description: 'show notifications already read' }
  ],
  run: cli.command(run)
}
