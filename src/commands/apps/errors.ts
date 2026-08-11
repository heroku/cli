import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {Formation} from '@heroku/types/3.sdk'
import {ux} from '@oclif/core/ux'

import errorInfo from '../../lib/apps/error-info.js'
import {AppErrors} from '../../lib/types/app-errors.js'

type ErrorSummary = Record<string, number>

const colorize = (level: string, s: string) => {
  switch (level) {
    case 'critical': {
      return color.failure(s)
    }

    case 'info': {
      return color.info(s)
    }

    case 'warning': {
      return color.warning(s)
    }

    default: {
      return s
    }
  }
}

function buildErrorTable(errors: ErrorSummary, source: string) {
  return Object.keys(errors).map(name => {
    const count = errors[name]
    const info = errorInfo.find(e => e.name === name)
    if (info) {
      return {
        count,
        level: info.level,
        name,
        source,
        title: info.title,
      }
    }

    return {
      count,
      level: 'critical',
      name,
      source,
      title: 'unknown error',
    }
  })
}

const sumErrors = (errors: AppErrors) => {
  const summed: ErrorSummary = {}
  for (const key of Object.keys(errors.data)) {
    summed[key] = errors.data[key].reduce((a, b) => a + b, 0)
  }

  return summed
}

export default class Errors extends Command {
  static description = 'view app errors'
  static flags = {
    app: flags.app({required: true}),
    dyno: flags.boolean({description: 'show only dyno errors'}),
    hours: flags.string({default: '24', description: 'number of hours to look back (default 24)'}),
    json: flags.boolean({description: 'output in json format'}),
    remote: flags.remote(),
    router: flags.boolean({description: 'show only router errors'}),
  }

  async run() {
    const {metrics, platform} = new HerokuSDK()
    const {flags} = await this.parse(Errors)

    const hours = Number.parseInt(flags.hours, 10)
    const NOW = new Date().toISOString()
    const YESTERDAY = new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString()
    const start_time = YESTERDAY
    const end_time = NOW
    const step = '1h'

    async function getAllDynoErrors(types: string[]) {
      const values = await Promise.all(types.map(dynoErrors))
      const memo: Record<string, ErrorSummary> = {}
      for (const [index, key] of types.entries()) {
        memo[key] = values[index]
      }

      return memo
    }

    const routerErrors = () => metrics.routerMetric.errors(
      flags.app,
      {
        end_time, process_type: 'web', start_time, step,
      },
    ).then(body => sumErrors(body as unknown as AppErrors))

    const dynoErrors = (type: string) => metrics.formationMetric.errors(
      flags.app,
      type,
      {end_time, start_time, step},
    ).catch((error: unknown) => {
      const e = error as {message?: string; statusCode?: number}
      // eslint-disable-next-line prefer-regex-literals
      const match = new RegExp('^invalid process_type provided', 'i')
      if (e?.statusCode === 400 && e.message && match.test(e.message)) {
        return {data: {}} as AppErrors
      }

      throw error
    }).then(body => sumErrors(body as unknown as AppErrors))

    const formation = await platform.formation.list(flags.app)
    const types = formation.map((p: Formation) => p.type)
    const showDyno = flags.dyno || !flags.router
    const showRouter = flags.router || !flags.dyno

    const noDynoEmpty: ReturnType<typeof getAllDynoErrors> = Promise.resolve({})
    const noRouterEmpty: ReturnType<typeof routerErrors> = Promise.resolve({})
    const [dyno, router] = await Promise.all([
      showDyno ? getAllDynoErrors(types) : noDynoEmpty,
      showRouter ? routerErrors() : noRouterEmpty,
    ])

    const errors = {
      dyno,
      router,
    }

    if (flags.json) {
      hux.styledJSON(errors)
    } else {
      let t = buildErrorTable(errors.router, 'router')
      for (const type of Object.keys(errors.dyno)) {
        t = t.concat(buildErrorTable(dyno[type], type))
      }

      if (t.length === 0) {
        ux.stdout(`No errors on ${color.app(flags.app)} in the last ${hours} hours`)
      } else {
        /* eslint-disable perfectionist/sort-objects */
        hux.table(t, {
          Source: {get: ({source}) => source},
          Name: {get: ({name, level}) => colorize(level, name)},
          Level: {get: ({level}) => colorize(level, level)},
          title: {header: 'Desc'},
          Count: {get: ({count}) => count},
        }, {title: `=== Errors on ${color.app(flags.app)} in the last ${hours} hours\n`, titleOptions: {bold: true}})
        /* eslint-enable perfectionist/sort-objects */
      }
    }
  }
}
