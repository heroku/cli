import {color, hux, utils} from '@heroku/heroku-cli-util'
import {flags as Flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../lib/data/baseCommand.js'
import {Maintenance} from '../../../lib/data/types.js'
import {constructSortFilterTableOptions, outputCSV} from '../../../lib/utils/tableUtils.js'

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
    const queryParams = new URLSearchParams({limit: flags.num})

    const addonResolver = new utils.AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(args.addon, flags.app)

    ux.action.start(`Fetching maintenance history for ${color.addon(addon.name!)}`)
    const {body: {maintenances}} = await this.dataApi.get<{maintenances: Maintenance[]}>(
      `/data/maintenances/v1/${addon.id}/history/?${queryParams.toString()}`,
      this.dataApi.defaults,
    )
    ux.action.stop()

    if (maintenances.length === 0) {
      this.log(`${color.addon(addon.name!)} does not have any maintenance history`)
      return
    }

    const tableColumns = {
      scheduled_for: {
        get: (row: Maintenance) => row && row.scheduled_for ? row.scheduled_for : '-',
        header: 'Scheduled for',
      },
      started_at: {
        get: (row: Maintenance) => row && row.started_at ? row.started_at : '-',
        header: 'Started at',
      },
      completed_at: {
        get: (row: Maintenance) => row && row.completed_at ? row.completed_at : '-',
        header: 'Completed at',
      },
      duration_seconds: {
        get: (row: Maintenance) => row && row.duration_seconds ? row.duration_seconds : '-',
        header: 'Duration (seconds)',
      },
      reason: {
        header: 'Reason',
      },
      status: {
        header: 'Status',
      },
      window: {
        get: (row: Maintenance) => row && row.window ? row.window : '-',
        header: 'Window',
      },
    }

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
