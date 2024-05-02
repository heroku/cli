'use strict'

const cli = require('@heroku/heroku-cli-util')
const stripAnsi = require('strip-ansi')

async function run(context, heroku) {
  const statusHelper = require('../../status_helper')
  const time = require('../../time')
  const {truncate} = require('lodash')

  let optimizationWidth = 0

  let descriptionWithStatus = function (d, r) {
    const width = () => process.stdout.columns > 80 ? process.stdout.columns : 80
    const trunc = (s, l) => {
      if (process.stdout.isTTY) {
        return truncate(s, {length: width() - (optimizationWidth + l), omission: '…'})
      }

      return s
    }

    const status = statusHelper.description(r, runningRelease, runningSlug)
    if (status) {
      const sc = cli.color[statusHelper.color(r.status)](status)
      return trunc(d, status.length + 1) + ' ' + sc
    }

    return trunc(d, 0)
  }

  let url = `/apps/${context.app}/releases`
  if (context.flags.extended) url += '?extended=true'
  let releases = await heroku.request({
    path: url,
    partial: true,
    headers: {
      Range: `version ..; max=${context.flags.num || 15}, order=desc`,
    },
  })

  let header = `${context.app} Releases`
  // eslint-disable-next-line unicorn/prefer-array-find
  let currentRelease = releases.filter(r => r.current === true)[0]
  if (currentRelease) {
    header += ' - ' + cli.color.blue(`Current: v${currentRelease.version}`)
  }

  let runningRelease = releases.filter(r => r.status === 'pending').slice(-1)[0]
  let runningSlug
  if (runningRelease && runningRelease.slug) {
    runningSlug = await heroku.get(`/apps/${context.app}/slugs/${runningRelease.slug.id}`)
  }

  let optimizeWidth = function (releases, columns, optimizeKey) {
    for (let col of columns) {
      col.optimizationWidth = 0
    }

    for (let row of releases) {
      for (let colKey in row) {
        if (colKey === optimizeKey) {
          continue
        }

        for (let col of columns) {
          let parts = col.key.split('.')
          let matchKey = parts[0]
          if (matchKey !== colKey) {
            continue
          }

          let colValue = row
          for (let part of parts) {
            colValue = colValue[part]
          }

          let formattedValue
          if (col.format) {
            formattedValue = col.format(colValue, row)
          } else {
            formattedValue = colValue.toString()
          }

          col.optimizationWidth = Math.max(
            col.optimizationWidth,
            stripAnsi(formattedValue).length,
          )
        }
      }
    }

    for (let col of columns) {
      if (col.key !== optimizeKey) {
        optimizationWidth += col.optimizationWidth + 2
      }
    }
  }

  let handleColorStatus = function (options) {
    if (context.flags.forceColor !== true) {
      return
    }

    cli.color.enabled = true

    let concatArguments = function (args) {
      return Array.prototype.map.call(args, function (arg) {
        return String(arg)
      }).join(' ')
    }

    options.printLine = function (...args) {
      cli.stdout += concatArguments(args) + '\n'
    }
  }

  if (context.flags.json) {
    cli.log(JSON.stringify(releases, null, 2))
  } else if (context.flags.extended) {
    cli.styledHeader(header)
    let options = {
      printHeader: false,
      columns: [
        {key: 'version', format: (v, r) => cli.color[statusHelper.color(r.status)]('v' + v)},
        {key: 'description', format: descriptionWithStatus},
        {key: 'user', format: u => cli.color.magenta(u.email.replace(/@addons\.heroku\.com$/, ''))},
        {key: 'created_at', format: t => time.ago(new Date(t))},
        {key: 'extended.slug_id'},
        {key: 'extended.slug_uuid'},
      ],
    }
    handleColorStatus(options)
    optimizeWidth(releases, options.columns, 'description')
    cli.table(releases, options)
  } else if (releases.length === 0) {
    cli.log(`${context.app} has no releases.`)
  } else {
    cli.styledHeader(header)
    let options = {
      printHeader: false,
      columns: [
        {key: 'version', label: '', format: (v, r) => cli.color[statusHelper.color(r.status)]('v' + v)},
        {key: 'description', format: descriptionWithStatus},
        {key: 'user', format: u => cli.color.magenta(u.email)},
        {key: 'created_at', format: t => time.ago(new Date(t))},
      ],
    }
    handleColorStatus(options)
    optimizeWidth(releases, options.columns, 'description')
    cli.table(releases, options)
  }
}

module.exports = {
  topic: 'releases',
  description: 'display the releases for an app',
  examples: `$ heroku releases
=== example Releases
v1 Config add FOO_BAR email@example.com 2015/11/17 17:37:41 (~ 1h ago)
v2 Config add BAR_BAZ email@example.com 2015/11/17 17:37:41 (~ 1h ago)
v3 Config add BAZ_QUX email@example.com 2015/11/17 17:37:41 (~ 1h ago)`,
  needsApp: true,
  needsAuth: true,
  flags: [
    {name: 'num', char: 'n', description: 'number of releases to show', hasValue: true},
    {name: 'json', description: 'output releases in json format'},
    {name: 'extended', char: 'x', hidden: true},
  ],
  run: cli.command(run),
}
