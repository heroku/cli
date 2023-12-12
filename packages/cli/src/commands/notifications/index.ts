import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import color from '@heroku-cli/color'
import {ux} from '@oclif/core'
import {Notifications} from '../../lib/types/notifications'
import * as time from '../../lib/notifications/time'
import * as wrap from 'word-wrap'

function displayNotifications(notifications: Notifications, app: Heroku.App | null, readNotification: boolean) {
  const read = readNotification ? 'Read' : 'Unread'
  ux.styledHeader(app ? `${read} Notifications for ${color.app(app.name!)}` : `${read} Notifications`)
  for (const n of notifications) {
    ux.log(color.yellow(`\n${n.title}\n`))
    ux.log(wrap(`\n${color.dim(time.ago(new Date(n.created_at)))}\n${n.body}`, {width: 80}))
    for (const followup of n.followup) {
      ux.log()
      ux.log(wrap(`${color.gray.dim(time.ago(new Date(followup.created_at)))}\n${followup.body}`, {width: 80}))
    }
  }
}

export default class NotificationsIndex extends Command {
  static description = 'display notifications'
  static topic = 'notifications'

  static flags = {
    app: flags.app({required: false}),
    all: flags.boolean({description: 'view all notifications (not just the ones for the current app)'}),
    json: flags.boolean({description: 'output in json format'}),
    read: flags.boolean({description: 'show notifications already read'}),
  }

  async run() {
    const {flags} = await this.parse(NotificationsIndex)

    const appResponse = flags.app && !flags.all ? await this.heroku.get<Heroku.App>(`/apps/${flags.app}`) : null
    const app = appResponse?.body
    const notificationsResponse = await this.heroku.get<Notifications>('/user/notifications', {hostname: 'telex.heroku.com'})
    let notifications = notificationsResponse.body
    if (app) notifications = notifications.filter(n => n.target.id === app.id)
    if (!flags.read) {
      notifications = notifications.filter(n => !n.read)
      await Promise.all(notifications.map(n => this.heroku.patch(`/user/notifications/${n.id}`, {hostname: 'telex.heroku.com', body: {read: true}})))
    }

    if (flags.json) {
      ux.styledJSON(notifications)
      return
    }

    if (notifications.length === 0) {
      if (flags.read) {
        if (app) ux.log(`You have no notifications on ${color.green(app.name!)}.\nRun heroku notifications --all to view notifications for all apps.`)
        else ux.log('You have no notifications.')
      } else if (app) ux.log(`No unread notifications on ${color.green(app.name!)}.\nRun ${color.cmd('heroku notifications --all')} to view notifications for all apps.`)
      else ux.log(`No unread notifications.\nRun ${color.cmd('heroku notifications --read')} to view read notifications.`)
    } else displayNotifications(notifications, app!, flags.read)
  }
}
