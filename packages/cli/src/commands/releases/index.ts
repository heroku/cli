import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import _ from 'lodash'
import stripAnsi from 'strip-ansi'

import * as statusHelper from '../../lib/releases/status_helper.js'
import * as time from '../../lib/time.js'

type ColumnConfig = {
  extended?: boolean
  get?: (row: Heroku.Release) => number | string | undefined
  header?: string
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
  static description = 'display the releases for an app'
  static examples = [
    'v1 Config add FOO_BAR email@example.com 2015/11/17 17:37:41 (~ 1h ago)',
    'v2 Config add BAR_BAZ email@example.com 2015/11/17 17:37:41 (~ 1h ago)',
    'v3 Config add BAZ_QUX email@example.com 2015/11/17 17:37:41 (~ 1h ago)',
  ]

  static flags = {
    app: flags.app({required: true}),
    extended: flags.boolean({char: 'x', hidden: true}),
    json: flags.boolean({description: 'output releases in json format'}),
    num: flags.string({char: 'n', description: 'number of releases to show'}),
    remote: flags.remote(),
  }

  static topic = 'releases'

  public async run(): Promise<void> {
    const {flags} = await this.parse(Index)
    const {app, extended, json, num} = flags

    const url = `/apps/${app}/releases${extended ? '?extended=true' : ''}`

    const {body: releases} = await this.heroku.request<Heroku.Release[]>(url, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
        Range: `version ..; max=${num || 15}, order=desc`,
      },
      partial: true,
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
          colorFn = color.failure

          break
        }

        case 'yellow': {
          colorFn = color.yellow

          break
        }

        case 'gray': {
          colorFn = color.inactive

          break
        }

        default: {
          colorFn = color.info
        }
        }

        const sc = colorFn(status)
        return trunc(status.length + 1, description) + ' ' + sc
      }

      return trunc(0, description)
    }

    const getVersionColor = (release: Heroku.Release) => {
      const statusColor = statusHelper.color(release.status)
      if (statusColor === 'red') return color.failure('v' + release.version)
      if (statusColor === 'yellow') return color.yellow('v' + release.version)
      if (statusColor === 'gray') return color.inactive('v' + release.version)
      return color.name('v' + release.version)
    }

    /* eslint-disable perfectionist/sort-objects */
    const columns: Record<string, ColumnConfig> = {
      // column name "v" as ux.table will make it's width at least "version" even though 'no-header': true
      v: {get: getVersionColor},
      description: {get: descriptionWithStatus},
      user: {get: ({user}) => color.user(user?.email || '')},
      created_at: {get: ({created_at}) => time.ago(new Date(created_at || ''))},
      slug_id: {extended: true, get: ({extended}) => extended?.slug_id},
      slug_uuid: {extended: true, get: ({extended}) => extended?.slug_uuid},
    }
    /* eslint-enable perfectionist/sort-objects */

    // `getDescriptionTruncation` is dependent on `columns` being defined and thus `descriptionWithStatus`.
    // `descriptionWithStatus` requires `optimizationWidth` to be defined. Redefine here before `descriptionWithStatus` is actually called.
    optimizationWidth = getDescriptionTruncation(releases, columns, 'description')

    if (json) {
      hux.styledJSON(releases)
    } else if (releases.length === 0) {
      ux.stdout(`${color.app(app)} has no releases.`)
    } else {
      let header = `${color.app(app)} Releases`
      const currentRelease = releases.find(r => r.current === true)
      if (currentRelease) {
        header += ' - ' + color.name(`Current: v${currentRelease.version}`)
      }

      hux.styledHeader(header)
      const sortedReleases = releases.sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
      hux.table(sortedReleases, columns)
    }
  }
}

