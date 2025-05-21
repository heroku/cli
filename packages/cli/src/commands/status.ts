import {color} from '@heroku-cli/color'
import {Command, Flags, ux} from '@oclif/core'
// import {hux} from '@heroku/heroku-cli-util'
import {formatDistanceToNow} from 'date-fns'
import {HTTP} from '@heroku/http-call'
import {maxBy} from '../lib/status/util.js'
import debug from 'debug'

const d = debug('status')

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

const printStatus = (status: string) => {
  const colorize = color[status]
  let message = capitalize(status)

  if (status === 'green') {
    message = 'No known issues at this time.'
  }

  return colorize(message)
}

interface StatusResponse {
  status: Array<{
    system: string
    status: string
  }>
  incidents: Array<{
    title: string
    created_at: string
    full_url: string
    updates: Array<{
      update_type: string
      updated_at: string
      contents: string
    }>
  }>
}

export default class Status extends Command {
  static description = 'display current status of the Heroku platform'

  static flags = {
    json: Flags.boolean({description: 'output in json format'}),
  }

  async run() {
    d('Starting status command...')
    const {flags} = await this.parse(Status)
    const apiPath = '/api/v4/current-status'
    const host = process.env.HEROKU_STATUS_HOST || 'https://status.heroku.com'
    const url = host + apiPath
    d(`Making request to ${url}`)

    try {
      d('Sending HTTP request...')
      const response = await HTTP.get<StatusResponse>(url)
      d('Response received:', response)
      const {body} = response
      d('Response body:', body)

      if (!body) {
        throw new Error('No response body received')
      }

      if (flags.json) {
        console.log(JSON.stringify(body, null, 2))
        return
      }

      d('Processing status items...')
      if (!body.status || !Array.isArray(body.status)) {
        throw new Error('Invalid response format: missing status array')
      }

      for (const item of body.status) {
        const message = printStatus(item.status)
        console.log(`${(item.system + ':').padEnd(11)}${message}`)
      }

      d('Processing incidents...')
      if (!body.incidents || !Array.isArray(body.incidents)) {
        throw new Error('Invalid response format: missing incidents array')
      }

      for (const incident of body.incidents) {
        console.log()
        console.log(`${incident.title} ${color.yellow(incident.created_at)} ${color.cyan(incident.full_url)}`)

        if (!incident.updates || !Array.isArray(incident.updates)) {
          console.log('No updates available')
          continue
        }

        const maxUpdate = maxBy(incident.updates, i => i.update_type.length)
        if (!maxUpdate) {
          console.log('No updates available')
          continue
        }

        const padding = maxUpdate.update_type.length + 0
        for (const u of incident.updates) {
          console.log(`${color.yellow(u.update_type.padEnd(padding))} ${new Date(u.updated_at).toISOString()} (${formatDistanceToNow(new Date(u.updated_at))} ago)`)
          console.log(`${u.contents}\n`)
        }
      }

      d('Finished processing.')
    } catch (error) {
      d('Error fetching status:', error)
      this.error(error instanceof Error ? error.message : 'Unknown error occurred')
    }
  }
}
