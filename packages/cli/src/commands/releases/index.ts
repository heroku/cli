import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {truncate} from 'lodash'
import * as Heroku from '@heroku-cli/schema'
import * as statusHelper from '../../lib/releases/status_helper'
import * as time from '../../lib/time'
import stripAnsi = require('strip-ansi')
import {table} from '@oclif/core/lib/cli-ux/styled/table'
import Columns = table.Columns

export default class Index extends Command {
  static topic = 'releases'
  static description = 'display the releases for an app'
  static usage = `$ heroku releases
=== example Releases
v1 Config add FOO_BAR email@example.com 2015/11/17 17:37:41 (~ 1h ago)
v2 Config add BAR_BAZ email@example.com 2015/11/17 17:37:41 (~ 1h ago)
v3 Config add BAZ_QUX email@example.com 2015/11/17 17:37:41 (~ 1h ago)`

  static flags = {
    num: flags.string({char: 'n', description: 'number of releases to show'}),
    json: flags.boolean({description: 'output releases in json format'}),
    extended: flags.boolean({char: 'x', hidden: true}),
    app: flags.app({required: true}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Index)
    const {app, num, json, extended} = flags

    let optimizationWidth = 0
    const descriptionWithStatus = function (release: Heroku.Release) {
      const {description} = release
      const width = () => process.stdout?.columns && process.stdout.columns > 80 ? process.stdout.columns : 80
      const trunc = (l: number, s?: string) => {
        if (process.stdout.isTTY) {
          return truncate(s, {length: width() - (optimizationWidth + l), omission: '…'})
        }

        return s
      }

      const status = statusHelper.description(release)
      if (status) {
        const sc = color[statusHelper.color(release.status)](status)
        return trunc(status.length + 1, description) + ' ' + sc
      }

      return trunc(0, description)
    }

    const url = `/apps/${app}/releases${extended ? '?extended=true' : ''}`

    const {body: releases} = await this.heroku.request<Heroku.Release[]>(url, {
      partial: true, headers: {
        Range: `version ..; max=${num || 15}, order=desc`,
      },
    })

    const optimizeWidth = function (columns: Columns<Heroku.Release>, optimizeKey: string) {
      // for (const col of Object.values(columns)) {
      //   col.minWidth = 0
      // }

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

            col.minWidth = Math.max(
              col.minWidth || 0,
              stripAnsi(formattedValue).length,
            )
          }
        }
      }

      for (const [key, col] of Object.entries(columns)) {
        if (key !== optimizeKey) {
          optimizationWidth += (col.minWidth || 0) + 2
        }
      }

      return columns
    }

    const handleColorStatus =  () => {
      color.enabled = true

      const concatArguments = function (args: string[]) {
        return Array.prototype.map.call(args, function (arg) {
          return String(arg)
        }).join(' ')
      }

      return  (...args: any[]) => {
        this.log(concatArguments(args))
      }
    }

    if (json) {
      ux.log(JSON.stringify(releases, null, 2))
    } else if (releases.length === 0) {
      ux.log(`${app} has no releases.`)
    } else {
      let header = `${app} Releases`
      const currentRelease = releases.find(r => r.current === true)
      if (currentRelease) {
        header += ' - ' + color.blue(`Current: v${currentRelease.version}`)
      }

      ux.styledHeader(header)
      ux.table(
        releases,
        optimizeWidth({
          version: {get: release => color[statusHelper.color(release.status)]('v' + release.version)},
          description: {get: descriptionWithStatus},
          user: {get: ({user}) => color.magenta(user?.email || '')},
          created_at: {get: ({created_at}) => time.ago(new Date(created_at || ''))},
          'extended.slug_id': {extended: true},
          'extended.slug_uuid': {extended: true},
        }, 'description'),
        // {
        //   version: {
        //     get: release => color[statusHelper.color(release.status)]('v' + release.version),
        //   },
        //   description: {get: descriptionWithStatus},
        //   user: {get: ({user}) => color.magenta(user?.email || '')},
        //   created_at: {get: ({created_at}) => time.ago(new Date(created_at || ''))},
        //   ...(extended ?
        //     {
        //       'extended.slug_id': {},
        //       'extended.slug_uuid': {},
        //     } :
        //     {}
        //   ),
        // },
        {'no-header': true, printLine: handleColorStatus(), extended},
      )
    }
  }
}
