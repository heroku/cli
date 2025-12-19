import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import _ from 'lodash'
import * as Heroku from '@heroku-cli/schema'

import * as statusHelper from '../../lib/releases/status_helper.js'
import * as time from '../../lib/time.js'
import stripAnsi from 'strip-ansi'

type ColumnConfig = {
  get?: (row: Heroku.Release) => string | number | undefined
  header?: string
  extended?: boolean
}

const getDescriptionTruncation = function (releases: Heroku.Release[], columns: Record<string, ColumnConfig>, optimizeKey: string) {
  // width management here is quite opaque.
  // This entire function is to determine how much of Formation.description should be truncated to accommodate for Formation.status. They both go in the same column.
  // Nothing else is truncated and the table is passed `'no-truncate': true` in options.
  let optimizationWidth = 0
  const optimizationWidthMap: Record<string, number> = {}
  for (const key of Object.keys(columns)) {
    optimizationWidthMap[key] = 0
  }

  for (const row of releases) {
    for (const colKey in row) {
      if (colKey === optimizeKey) {
        continue
      }

      for (const [key, col] of Object.entries(columns)) {
        const parts = key.split('.')
        const matchKey = parts[0]
        if (matchKey !== colKey) {
          continue
        }

        let colValue = row
        for (const part of parts) {
          colValue = colValue[part]
        }

        let formattedValue
        if (col.get) {
          formattedValue = col.get(row)
        } else {
          formattedValue = colValue.toString()
        }

        if (key !== optimizeKey) {
          optimizationWidthMap[key] = Math.max(
            optimizationWidthMap[key],
            stripAnsi(String(formattedValue)).length,
          )
        }
      }
    }
  }

  for (const key of Object.keys(columns)) {
    if (key !== optimizeKey) {
      optimizationWidth += optimizationWidthMap[key] + 2
    }
  }

  return optimizationWidth
}

export default class Index extends Command {
  static topic = 'releases'
  static description = 'display the releases for an app'
  static examples = [
    'v1 Config add FOO_BAR email@example.com 2015/11/17 17:37:41 (~ 1h ago)',
    'v2 Config add BAR_BAZ email@example.com 2015/11/17 17:37:41 (~ 1h ago)',
    'v3 Config add BAZ_QUX email@example.com 2015/11/17 17:37:41 (~ 1h ago)',
  ]

  static flags = {
    num: flags.string({char: 'n', description: 'number of releases to show'}),
    json: flags.boolean({description: 'output releases in json format'}),
    extended: flags.boolean({char: 'x', hidden: true}),
    remote: flags.remote(),
    app: flags.app({required: true}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Index)
    const {app, num, json, extended} = flags

    const url = `/apps/${app}/releases${extended ? '?extended=true' : ''}`

    const {body: releases} = await this.heroku.request<Heroku.Release[]>(url, {
      partial: true,
      headers: {
        Range: `version ..; max=${num || 15}, order=desc`,
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })

    let optimizationWidth = 0

    const descriptionWithStatus = function (release: Heroku.Release) {
      const {description} = release
      const width = () => process.stdout?.columns && process.stdout.columns > 80 ? process.stdout.columns : 80
      const trunc = (l: number, s?: string) => {
        if (process.stdout.isTTY) {
          return _.truncate(s, {length: width() - (optimizationWidth + l), omission: '…'})
        }

        return s
      }

      const status = statusHelper.description(release)
      if (status) {
        const statusColor = statusHelper.color(release.status)
        let colorFn: (s: string) => string
        switch (statusColor) {
        case 'red': {
          colorFn = color.red

          break
        }

        case 'yellow': {
          colorFn = color.yellow

          break
        }

        case 'gray': {
          colorFn = color.gray

          break
        }

        default: {
          colorFn = color.cyan
        }
        }

        const sc = colorFn(status)
        return trunc(status.length + 1, description) + ' ' + sc
      }

      return trunc(0, description)
    }

    const getVersionColor = (release: Heroku.Release) => {
      const statusColor = statusHelper.color(release.status)
      if (statusColor === 'red') return color.red('v' + release.version)
      if (statusColor === 'yellow') return color.yellow('v' + release.version)
      if (statusColor === 'gray') return color.gray('v' + release.version)
      return color.cyan('v' + release.version)
    }

    const columns: Record<string, ColumnConfig> = {
      // column name "v" as ux.table will make it's width at least "version" even though 'no-header': true
      v: {get: getVersionColor},
      description: {get: descriptionWithStatus},
      user: {get: ({user}) => color.magenta(user?.email || '')},
      created_at: {get: ({created_at}) => time.ago(new Date(created_at || ''))},
      slug_id: {extended: true, get: ({extended}) => extended?.slug_id},
      slug_uuid: {extended: true, get: ({extended}) => extended?.slug_uuid},
    }

    // `getDescriptionTruncation` is dependent on `columns` being defined and thus `descriptionWithStatus`.
    // `descriptionWithStatus` requires `optimizationWidth` to be defined. Redefine here before `descriptionWithStatus` is actually called.
    optimizationWidth = getDescriptionTruncation(releases, columns, 'description')

    if (json) {
      hux.styledJSON(releases)
    } else if (releases.length === 0) {
      ux.stdout(`${app} has no releases.`)
    } else {
      let header = `${app} Releases`
      const currentRelease = releases.find(r => r.current === true)
      if (currentRelease) {
        header += ' - ' + color.cyan(`Current: v${currentRelease.version}`)
      }

      hux.styledHeader(header)
      const sortedReleases = releases.sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
      hux.table(sortedReleases, columns)
    }
  }
}

