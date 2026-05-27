import {Command, flags as Flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {MaintenanceInfoByAppResult} from '@heroku/types/data'
import {ux} from '@oclif/core/ux'

import {MaintenanceStatus} from '../../../lib/data/types.js'
import {constructSortFilterTableOptions, constructTableColumns, outputCSV} from '../../../lib/utils/table-utils.js'

type MaintenanceItem = MaintenanceInfoByAppResult['maintenances'][number]

export default class DataMaintenancesIndex extends Command {
  static description = 'list maintenances for an app\'s data addons'
  static examples = [
    '$ heroku data:maintenances --app production-app',
    '$ heroku data:maintenances --app production-app --json',
  ]
  static flags = {
    app: Flags.app({
      description: 'app to list addon maintenances for',
      required: true,
    }),
    columns: Flags.string({description: 'only show provided columns (comma-separated)'}),
    csv: Flags.boolean({char: 'c', description: 'output in csv format'}),
    extended: Flags.boolean({char: 'x', description: 'show extra columns'}),
    filter: Flags.string({description: 'filter property by partial string matching, ex: name=foo'}),
    json: Flags.boolean({char: 'j', description: 'output result in json'}),
    remote: Flags.remote(),
    sort: Flags.string({description: 'sort by property'}),
  }

  async run() {
    const {flags} = await this.parse(DataMaintenancesIndex)

    const maintenances = await this.fetchMaintenances(flags.app)

    if (maintenances.length === 0) {
      this.error(`No maintenances found for app ${flags.app}`)
    }

    const tableColumns = this.getTableColumns(flags.extended, flags.columns)

    if (flags.json) {
      hux.styledJSON(maintenances)
    } else if (flags.csv) {
      outputCSV(maintenances, tableColumns)
    } else {
      this.renderTable(maintenances, tableColumns, flags)
    }
  }

  private async fetchMaintenances(appName: string) {
    ux.action.start('Fetching maintenances')
    const {body: app} = await this.heroku.get<Heroku.App>(`/apps/${appName}`)
    const {data} = new HerokuSDK()
    const result = await data.maintenance.infoByApp(app.id!)
    ux.action.stop()

    return result.maintenances
  }

  private getTableColumns(extended: boolean, columns: string | undefined) {
    /* eslint-disable perfectionist/sort-objects */
    const allTableColumns = {
      addon: {
        get: (row: MaintenanceItem) => row.addon && row.addon.name,
        header: 'Addon',
      },
      attachments: {
        get(row: MaintenanceItem) {
          const attachments = (row && row.addon && row.addon.attachments) || []
          return attachments.join(', ')
        },
        header: 'Attachments',
      },
      window: {
        get: (row: MaintenanceItem) => row && row.addon && row.addon.window,
        header: 'Scheduling Window',
      },
      status: {
        header: 'Status',
      },
      required_by: {
        get(row: MaintenanceItem) {
          if (row.status === MaintenanceStatus.completed) {
            return '-'
          }

          return row.required_by ?? '-'
        },
        header: 'Required by',
      },
      scheduled_for: {
        get(row: MaintenanceItem) {
          if (row.status === MaintenanceStatus.completed) {
            return '-'
          }

          return row.scheduled_for ?? '-'
        },
        header: 'Scheduled for',
      },
      kind: {
        get: (row: MaintenanceItem) => row.addon.kind,
        header: 'Kind',
      },
      plan: {
        get: (row: MaintenanceItem) => row.addon.plan,
        header: 'Plan',
      },
    }
    /* eslint-enable perfectionist/sort-objects */

    const baseColumnNames = ['addon', 'attachments', 'window', 'status', 'required_by', 'scheduled_for']

    return constructTableColumns(allTableColumns, baseColumnNames, extended, columns)
  }

  private renderTable(maintenances: MaintenanceItem[], tableColumns: Record<string, any>, flags: Record<string, any>) {
    const tableOptions = constructSortFilterTableOptions(flags, tableColumns)
    hux.table(maintenances, tableColumns, tableOptions)
  }
}
