import type {DiffRow} from '@heroku/sdk/resources/platform/app'

import {Command} from '@heroku-cli/command'
import {hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {appExtensions} from '@heroku/sdk/extensions/platform'
import {Args, ux} from '@oclif/core'

import {sdkClientOptions} from '../../lib/apps/client-options.js'

function trunc(val: unknown): string {
  const v = (val ?? '').toString()
  return v.length > 56 ? v.slice(0, 56) + '...' : v
}

export default class AppsDiff extends Command {
  static args = {
    app1: Args.string({description: 'first app to compare', required: true}),
    app2: Args.string({description: 'second app to compare', required: true}),
  }
  static description = 'diffs two apps'
  static help = 'help text for apps:diff'
  static topic = 'apps'

  public async run(): Promise<DiffRow[]> {
    const {platform} = new HerokuSDK({clientOptions: sdkClientOptions(this.heroku), extensions: [appExtensions]})
    const {args} = await this.parse(AppsDiff)
    const {app1, app2} = args

    const list = await platform.app.diff(app1, app2)
    const truncated = list.map(entry => ({
      app1: trunc(entry.app1),
      app2: trunc(entry.app2),
      prop: entry.prop,
    }))

    ux.stdout('\n')
    type TableRow = {app1: string; app2: string; prop: string;}
    hux.table(truncated, {
      firstApp: {get: (row: TableRow) => row.app1, header: app1},
      property: {get: (row: TableRow) => row.prop, header: 'property'},
      secondApp: {get: (row: TableRow) => row.app2, header: app2},
    })
    ux.stdout('\n')

    return list
  }
}
