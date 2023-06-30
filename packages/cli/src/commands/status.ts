import color from '@heroku-cli/color'
import {Command, Flags, CliUx} from '@oclif/core'
import * as distanceInWordsToNow from 'date-fns/distance_in_words_to_now'
import HTTP from 'http-call'

import {maxBy} from 'src/lib/status/util'

const capitalize = (str: string) => str.slice(0, 1).toUpperCase() + str.slice(1)

const printStatus = (status: string) => {
  const colorize = (color as any)[status]
  let message = capitalize(status)

  if (status === 'green') {
    message = 'No known issues at this time.'
  }

  return colorize(message)
}

export default class Status extends Command {
  static description = 'display current status of the Heroku platform'

  static flags = {
    json: Flags.boolean({description: 'output in json format'}),
  }

  async run() {
    const {flags} = await this.parse(Status)
    const apiPath = '/api/v4/current-status'

    const host = process.env.HEROKU_STATUS_HOST || 'https://status.heroku.com'
    const {body} = await HTTP.get<any>(host + apiPath)

    if (flags.json) {
      CliUx.ux.styledJSON(body)
      return
    }

    for (const item of body.status) {
      const message = printStatus(item.status)

      this.log(`${(item.system + ':').padEnd(11)}${message}`)
    }

    for (const incident of body.incidents) {
      CliUx.ux.log()
      CliUx.ux.styledHeader(`${incident.title} ${color.yellow(incident.created_at)} ${color.cyan(incident.full_url)}`)

      const padding = maxBy(incident.updates, (i: any) => i.update_type.length).update_type.length + 0
      for (const u of incident.updates) {
        CliUx.ux.log(`${color.yellow(u.update_type.padEnd(padding))} ${new Date(u.updated_at).toISOString()} (${distanceInWordsToNow(new Date(u.updated_at))} ago)`)
        CliUx.ux.log(`${u.contents}\n`)
      }
    }
  }
}
