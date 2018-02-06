import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import cli from 'cli-ux'
import * as distanceInWordsToNow from 'date-fns/distance_in_words_to_now'
import HTTP from 'http-call'

import {maxBy} from '../util'

export default class Status extends Command {
  static description = 'display current status of the Heroku platform'
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
  }

  async run() {
    const {flags} = this.parse(Status)
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
    let {body} = await HTTP.get(host + apiPath)

    if (flags.json) {
      cli.styledJSON(body)
      return
    }

    for (let item of body.status) {
      let message = printStatus(item.status)

      this.log(`${(item.system + ':').padEnd(11)}${message}`)
    }

    for (let incident of body.incidents) {
      cli.log()
      cli.styledHeader(`${incident.title} ${color.yellow(incident.created_at)} ${color.cyan(incident.full_url)}`)

      let padding = maxBy(incident.updates, (i: any) => i.update_type.length).update_type.length + 0
      for (let u of incident.updates) {
        cli.log(`${color.yellow(u.update_type.padEnd(padding))} ${new Date(u.updated_at).toISOString()} (${distanceInWordsToNow(new Date(u.updated_at))} ago)`)
        cli.log(`${u.contents}\n`)
      }
    }
  }
}
