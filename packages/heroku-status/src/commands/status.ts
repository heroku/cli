import color from '@heroku-cli/color'
import { Command, flags } from '@heroku-cli/command'
import cli from 'cli-ux'
import _ from 'ts-lodash'

export default class Status extends Command {
  static description = 'display current status of the Heroku platform'
  static flags = {
    json: flags.boolean({ description: 'output in json format' }),
  }

  async run() {
    const moment = require('moment')
    const sprintf = require('sprintf-js').sprintf
    const apiPath = '/api/v4/current-status'

    const capitalize = (str: string) => str.substr(0, 1).toUpperCase() + str.substr(1)
    const printStatus = (status: string) => {
      const colorize = (color as any)[status]
      let message = capitalize(status)

      if (status === 'green') {
        message = 'No known issues at this time.'
      }
      return colorize(message)
    }

    let host = process.env.HEROKU_STATUS_HOST || 'https://status.heroku.com'
    let { body } = await this.http.get(host + apiPath)

    if (this.flags.json) {
      cli.styledJSON(body)
      return
    }

    for (let item of body.status) {
      let message = printStatus(item.status)

      cli.log(sprintf('%-10s %s', item.system + ':', message))
    }

    for (let incident of body.incidents) {
      cli.log()
      cli.styledHeader(
        `${incident.title} ${color.yellow(moment(incident.created_at).format('LT'))} ${color.cyan(incident.full_url)}`,
      )

      let padding = (_.maxBy(incident.updates, 'update_type.length') as any).update_type.length + 0
      for (let u of incident.updates) {
        cli.log(
          `${color.yellow(_.padEnd(u.update_type, padding))} ${moment(u.updated_at).format('LT')} (${moment(
            u.updated_at,
          ).fromNow()})`,
        )
        cli.log(`${u.contents}\n`)
      }
    }
  }
}
