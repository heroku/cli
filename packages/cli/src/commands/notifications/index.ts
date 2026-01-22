import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import wrap from 'word-wrap'

import * as time from '../../lib/time.js'
import {Notifications} from '../../lib/types/notifications.js'

function displayNotifications(notifications: Notifications, app: Heroku.App | null, readNotification: boolean) {
  const read = readNotification ? 'Read' : 'Unread'
  hux.styledHeader(app ? `${read} Notifications for ${color.app(app.name!)}` : `${read} Notifications`)
  for (const n of notifications) {
    ux.stdout(color.yellow(`\n${n.title}\n`))
    ux.stdout(wrap(`\n${color.dim(time.ago(new Date(n.created_at)))}\n${n.body}`, {width: 80}))
    for (const followup of n.followup) {
      ux.stdout()
      ux.stdout(wrap(`${color.gray.dim(time.ago(new Date(followup.created_at)))}\n${followup.body}`, {width: 80}))
    }
  }
}

export default class NotificationsIndex extends Command {
  static description = 'display notifications'
  static flags = {
    all: flags.boolean({description: 'view all notifications (not just the ones for the current app)'}),
    app: flags.app({required: false}),
    json: flags.boolean({description: 'output in json format'}),
    read: flags.boolean({description: 'show notifications already read'}),
    remote: flags.remote(),
  }

  static topic = 'notifications'

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
      hux.styledJSON(notifications)
      return
    }

    if (notifications.length === 0) {
      if (flags.read) {
        if (app) ux.stdout(`You have no notifications on ${color.app(app.name!)}.\nRun heroku notifications --all to view notifications for all apps.`)
        else ux.stdout('You have no notifications.')
      } else if (app) ux.stdout(`No unread notifications on ${color.app(app.name!)}.\nRun ${color.code('heroku notifications --all')} to view notifications for all apps.`)
      else ux.stdout(`No unread notifications.\nRun ${color.code('heroku notifications --read')} to view read notifications.`)
    } else displayNotifications(notifications, app!, flags.read)
  }
}
