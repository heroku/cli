import {flags as Flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {maintenanceExtensions} from '@heroku/sdk/extensions/data'
import {type MaintenanceHistoryResult} from '@heroku/types/data'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../lib/data/base-command.js'
import {createSDK} from '../../../lib/sdk.js'
import {constructSortFilterTableOptions, constructTableColumns, outputCSV} from '../../../lib/utils/table-utils.js'

type MaintenanceHistoryItem = MaintenanceHistoryResult['maintenances'][number]

export default class DataMaintenancesHistory extends BaseCommand {
  static args = {
    addon: Args.string({description: 'data addon', required: true}),
  }
  static description = 'show details of the most recent maintenances for an addon'
  static examples = [
    '$ heroku data:maintenances:history postgresql-sinuous-92834',
    '$ heroku data:maintenances:history postgresql-sinuous-92834 --num 10',
    '$ heroku data:maintenances:history postgresql-sinuous-92834 --json',
    '$ heroku data:maintenances:history DATABASE --app production-app',
  ]
  static flags = {
    app: Flags.app(),
    columns: Flags.string({description: 'only show provided columns (comma-separated)'}),
    csv: Flags.boolean({char: 'c', description: 'output in csv format'}),
    filter: Flags.string({description: 'filter property by partial string matching, ex: name=foo'}),
    json: Flags.boolean({
      char: 'j',
      description: 'show result formatted in json',
    }),
    num: Flags.string({
      char: 'n',
      default: '5',
      description: 'number of maintenances to show (maximum is 20)',
    }),
    remote: Flags.remote(),
    sort: Flags.string({description: 'sort by property'}),
  }

  async run() {
    const {args, flags} = await this.parse(DataMaintenancesHistory)
    const {data} = createSDK(this.heroku, {extensions: [maintenanceExtensions]})

    const {addon, history} = await data.maintenance.history(args.addon, {limit: Number(flags.num)}, {
      appIdentity: flags.app,
      beforeHistory({addon}) {
        ux.action.start(`Fetching maintenance history for ${color.addon(addon.name)}`)
      },
    })
    ux.action.stop()

    const {maintenances} = history

    if (maintenances.length === 0) {
      this.log(`${color.addon(addon.name)} does not have any maintenance history`)
      return
    }

    /* eslint-disable perfectionist/sort-objects */
    const allTableColumns = {
      scheduled_for: {
        get: (row: MaintenanceHistoryItem) => row && row.scheduled_for ? row.scheduled_for : '-',
        header: 'Scheduled for',
      },
      started_at: {
        get: (row: MaintenanceHistoryItem) => row && row.started_at ? row.started_at : '-',
        header: 'Started at',
      },
      completed_at: {
        get: (row: MaintenanceHistoryItem) => row && row.completed_at ? row.completed_at : '-',
        header: 'Completed at',
      },
      duration_seconds: {
        get: (row: MaintenanceHistoryItem) => row && row.duration_seconds ? row.duration_seconds : '-',
        header: 'Duration (seconds)',
      },
      reason: {
        header: 'Reason',
      },
      status: {
        header: 'Status',
      },
      window: {
        get: (row: MaintenanceHistoryItem) => row && row.window ? row.window : '-',
        header: 'Window',
      },
    }
    /* eslint-enable perfectionist/sort-objects */
    const tableColumns = constructTableColumns(allTableColumns, Object.keys(allTableColumns), false, flags.columns)

    if (flags.json) {
      hux.styledJSON(maintenances)
    } else if (flags.csv) {
      outputCSV(maintenances, tableColumns)
    } else {
      const tableOptions = constructSortFilterTableOptions(flags, tableColumns)
      hux.table(maintenances, tableColumns, tableOptions)
    }
  }
}
