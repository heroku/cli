// @flow

import {Command, flags} from 'cli-engine-heroku'

export default class Status extends Command {
  static topic = 'status'
  static description = 'display current status of Heroku platform'
  static flags = {
    json: flags.boolean({description: 'output in json format'})
  }

  async run () {
    const moment = require('moment')
    const maxBy = require('lodash.maxby')
    const padEnd = require('lodash.padend')
    const sprintf = require('sprintf-js').sprintf
    const apiPath = '/api/v4/current-status'

    const capitalize = str => str.substr(0, 1).toUpperCase() + str.substr(1)
    const printStatus = status => {
      const colorize = this.out.color[status]
      let message = capitalize(status)

      if (status === 'green') {
        message = 'No known issues at this time.'
      }
      return colorize(message)
    }

    let host = process.env.HEROKU_STATUS_HOST || 'https://status.heroku.com'
    let response = await this.http.get(host + apiPath)

    if (this.flags.json) {
      this.out.styledJSON(response)
      return
    }

    for (let item of response.status) {
      var message = printStatus(item.status)

      this.out.log(sprintf('%-10s %s', item.system + ':', message))
    }

    for (let incident of response.incidents) {
      this.out.log()
      this.out.styledHeader(`${incident.title} ${this.out.color.yellow(moment(incident.created_at).format('LT'))} ${this.out.color.cyan(incident.full_url)}`)

      let padding = maxBy(incident.updates, 'update_type.length').update_type.length + 1
      for (let u of incident.updates) {
        this.out.log(`${this.out.color.yellow(padEnd(u.update_type, padding))} ${moment(u.updated_at).format('LT')} (${moment(u.updated_at).fromNow()})`)
        this.out.log(`${u.contents}\n`)
      }
    }
  }
}
