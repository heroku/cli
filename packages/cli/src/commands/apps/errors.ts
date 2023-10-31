'use strict'

const cli = require('heroku-cli-util')

const colorize = (level, s) => {
  switch (level) {
  case 'critical':
    return cli.color.red(s)
  case 'warning':
    return cli.color.yellow(s)
  case 'info':
    return cli.color.cyan(s)
  default:
    return s
  }
}

function buildErrorTable(errors, source) {
  const errorInfo = require('@heroku-cli/plugin-apps-v5/src/error_info')

  return Object.keys(errors).map(name => {
    const count = errors[name]
    const info = errorInfo.find(e => e.name === name)
    return {name, count, source, level: info.level, title: info.title}
  })
}

async function run(context, heroku) {
  const {sum} = require('lodash')

  const hours = Number.parseInt(context.flags.hours) || 24
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

  function routerErrors() {
    return heroku.request({
      host: 'api.metrics.herokai.com',
      path: `/apps/${context.app}/router-metrics/errors?${DATE}&process_type=web`,
      headers: {Range: ''},
    }).then(rsp => {
      Object.keys(rsp.data).forEach(key => {
        rsp.data[key] = sum(rsp.data[key])
      })
      return rsp.data
    })
  }

  function dynoErrors(type) {
    return heroku.request({
      host: 'api.metrics.herokai.com',
      path: `/apps/${context.app}/formation/${type}/metrics/errors?${DATE}`,
      headers: {Range: ''},
    }).catch(error => {
      // eslint-disable-next-line prefer-regex-literals
      const match = new RegExp('^invalid process_type provided', 'i')
      if (error.statusCode === 400 && error.body && error.body.message && match.test(error.body.message)) {
        return {data: {}}
      }

      throw error
    }).then(rsp => {
      Object.keys(rsp.data).forEach(key => {
        rsp.data[key] = sum(rsp.data[key])
      })
      return rsp.data
    })
  }

  const formation = await heroku.get(`/apps/${context.app}/formation`)
  const types = formation.map(p => p.type)
  const showDyno = context.flags.dyno || !context.flags.router
  const showRouter = context.flags.router || !context.flags.dyno

  const [dyno, router] = await Promise.all([
    showDyno ? getAllDynoErrors(types) : {},
    showRouter ? routerErrors() : {},
  ])

  const errors = {
    dyno,
    router,
  }

  if (context.flags.json) {
    cli.styledJSON(errors)
  } else {
    let t = buildErrorTable(errors.router, 'router')
    for (const type of Object.keys(errors.dyno)) t = t.concat(buildErrorTable(errors.dyno[type], type))
    if (t.length === 0) {
      cli.log(`No errors on ${cli.color.app(context.app)} in the last ${hours} hours`)
    } else {
      cli.styledHeader(`Errors on ${cli.color.app(context.app)} in the last ${hours} hours`)
      cli.table(t, {
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

module.exports = {
  topic: 'apps',
  command: 'errors',
  description: 'view app errors',
  needsAuth: true,
  needsApp: true,
  flags: [
    {name: 'json', description: 'output in json format'},
    {name: 'hours', hasValue: true, description: 'number of hours to look back (default 24)'},
    {name: 'router', description: 'show only router errors'},
    {name: 'dyno', description: 'show only dyno errors'},
  ],
  run: cli.command(run),
}
