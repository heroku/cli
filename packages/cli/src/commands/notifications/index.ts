import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import color from '@heroku-cli/color'
import {ux} from '@oclif/core'

function displayNotifications(notifications, app: Heroku.App | null, readNotification: boolean) {
  const wrap = cli.linewrap(2, 80)
  const read = readNotification ? 'Read' : 'Unread'
  ux.styledHeader(app ? `${read} Notifications for ${color.app(app.name!)}` : `${read} Notifications`)
  for (const n of notifications) {
    ux.log(color.yellow(`\n${n.title}\n`))
    ux.log(wrap(`${color.dim(time.ago(new Date(n.created_at)))}\n${n.body}`))
    for (const followup of n.followup) {
      ux.log(wrap(`${color.gray.dim(time.ago(new Date(followup.created_at)))}\n${followup.body}`))
    }
  }
}

export default class NotificationsIndex extends Command {
  static description = 'display notifications'
  static topic = 'notifications'

  static flags = {
    app: flags.app({required: true}),
    all: flags.boolean({description: 'view all notifications (not just the ones for the current app)'}),
    json: flags.boolean({description: 'output in json format'}),
    read: flags.boolean({description: 'show notifications already read'}),
  }

  async run() {
    const {flags} = await this.parse(NotificationsIndex)

    const app = flags.app && !flags.all ? await this.heroku.get<Heroku.App>(`/apps/${flags.app}`) : null
    let notifications = await this.heroku.request({host: 'telex.heroku.com', path: '/user/notifications'})
    if (app) notifications = notifications.filter(n => n.target.id === app.id)
    if (!flags.read) {
      notifications = notifications.filter(n => !n.read)
      await Promise.all(notifications.map(n => this.heroku.request({host: 'telex.heroku.com', path: `/user/notifications/${n.id}`, method: 'PATCH', body: {read: true}})))
    }

    if (flags.json) {
      ux.styledJSON(notifications)
      return
    }

    if (notifications.length === 0) {
      if (flags.read) {
        if (app) ux.warn(`You have no notifications on ${color.green(app.name)}.\nRun heroku notifications --all to view notifications for all apps.`)
        else ux.warn('You have no notifications.')
      } else if (app) ux.warn(`No unread notifications on ${color.green(app.name)}.\nRun ${color.cmd('heroku notifications --all')} to view notifications for all apps.`)
      else ux.warn(`No unread notifications.\nRun ${color.cmd('heroku notifications --read')} to view read notifications.`)
    } else displayNotifications(notifications, app, flags.read)
  }
}
