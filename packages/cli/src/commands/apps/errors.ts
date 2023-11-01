import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {HTTP} from 'http-call'
import {sum} from 'lodash'
import errorInfo from '../../lib/apps/error_info'
import * as Heroku from '@heroku-cli/schema'
import {AppErrors} from '../../lib/types/app_errors'

const colorize = (level: string, s: string) => {
  switch (level) {
  case 'critical':
    return color.red(s)
  case 'warning':
    return color.yellow(s)
  case 'info':
    return color.cyan(s)
  default:
    return s
  }
}

function buildErrorTable(errors, source) {
  return Object.keys(errors).map(name => {
    const count = errors[name]
    const info = errorInfo.find(e => e.name === name)
    return {name, count, source, level: info.level, title: info.title}
  })
}

const sumErrors = (errors: AppErrors) => {
  const summed: Record<string, number> = {}
  Object.keys(errors.data).forEach(key => {
    summed[key] = sum(errors.data[key])
  })
  return summed
}

export default class Errors extends Command {
  static description = 'view app errors'

  static flags = {
    app: flags.app({required: true}),
    json: flags.boolean({description: 'output in json format'}),
    hours: flags.string({description: 'number of hours to look back (default 24)'}),
    router: flags.boolean({description: 'show only router errors'}),
    dyno: flags.boolean({description: 'show only dyno errors'}),
  }

  async run() {
    const {flags} = await this.parse(Errors)

    const hours = Number.parseInt(flags.hours || '') || 24
    const NOW = new Date().toISOString()
    const YESTERDAY = new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString()
    const DATE = `start_time=${YESTERDAY}&end_time=${NOW}&step=1h`

    async function getAllDynoErrors(types) {
      const values = await Promise.all(types.map(dynoErrors))
      return types.reduce((memo, key, index) => {
        memo[key] = values[index]
        return memo
      }, {})
    }

    const routerErrors = async () => {
      const {body} = await this.heroku.get<AppErrors>(
        `/apps/${flags.app}/router-metrics/errors?${DATE}&process_type=web`,
        {
          host: 'api.metrics.herokai.com',
          headers: {Range: ''},
        })
      return sumErrors(body)
    }

    const dynoErrors = (type: string) => {
      return this.heroku.get<AppErrors>(
        `/apps/${flags.app}/formation/${type}/metrics/errors?${DATE}`,
        {
          host: 'api.metrics.herokai.com',
          headers: {Range: ''},
        },
      ).catch(error => {
        // eslint-disable-next-line prefer-regex-literals
        const match = new RegExp('^invalid process_type provided', 'i')
        if (error.statusCode === 400 && error.body && error.body.message && match.test(error.body.message)) {
          return {body: {data: {}}}
        }

        throw error
      }).then(rsp => {
        const {body} = rsp as HTTP<AppErrors>
        return sumErrors(body)
      })
    }

    const {body: formation} = await this.heroku.get<Heroku.Formation>(`/apps/${flags.app}/formation`)
    const types = formation.map((p: Heroku.Formation) => p.type)
    const showDyno = flags.dyno || !flags.router
    const showRouter = flags.router || !flags.dyno

    const [dyno, router] = await Promise.all([
      showDyno ? getAllDynoErrors(types) : {},
      showRouter ? routerErrors() : {},
    ])

    const errors = {
      dyno,
      router,
    }

    if (flags.json) {
      ux.styledJSON(errors)
    } else {
      let t = buildErrorTable(errors.router, 'router')
      for (const type of Object.keys(errors.dyno)) t = t.concat(buildErrorTable(errors.dyno[type], type))
      if (t.length === 0) {
        ux.log(`No errors on ${color.app(flags.app)} in the last ${hours} hours`)
      } else {
        ux.styledHeader(`Errors on ${color.app(flags.app)} in the last ${hours} hours`)
        ux.table(t, {
          columns: [
            {key: 'source'},
            {key: 'name', format: (name, row) => colorize(row.level, name)},
            {key: 'level', format: level => colorize(level, level)},
            {key: 'title', label: 'desc'},
            {key: 'count'},
          ],
        })
      }
    }
  }
}

