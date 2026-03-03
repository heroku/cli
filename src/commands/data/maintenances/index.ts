import {hux} from '@heroku/heroku-cli-util'
import {flags as Flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

import BaseCommand from '../../../lib/data/baseCommand.js'
import {Maintenance, MaintenanceStatus} from '../../../lib/data/types.js'
import {constructSortFilterTableOptions, outputCSV} from '../../../lib/utils/tableUtils.js'

export default class DataMaintenancesIndex extends BaseCommand {
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

    const tableColumns = this.constructTableColumns(flags.extended)

    if (flags.json) {
      hux.styledJSON(maintenances)
    } else if (flags.csv) {
      outputCSV(maintenances, tableColumns)
    } else {
      this.renderTable(maintenances, tableColumns, flags)
    }
  }

  private constructTableColumns(extended: boolean) {
    const tableColumns = {
      addon: {
        get: (row: Maintenance) => row.addon && row.addon.name,
        header: 'Addon',
      },
      attachments: {
        get(row: Maintenance) {
          const attachments = (row && row.addon && row.addon.attachments) || []
          return attachments.join(', ')
        },
        header: 'Attachments',
      },
      window: {
        get: (row: Maintenance) => row && row.addon && row.addon.window,
        header: 'Scheduling Window',
      },
      status: {
        header: 'Status',
      },
      required_by: {
        get(row: Maintenance) {
          if (row.status === MaintenanceStatus.completed) {
            return '-'
          }

          return row.required_by ?? '-'
        },
        header: 'Required by',
      },
      scheduled_for: {
        get(row: Maintenance) {
          if (row.status === MaintenanceStatus.completed) {
            return '-'
          }

          return row.scheduled_for ?? '-'
        },
        header: 'Scheduled for',
      },
    }

    if (extended) {
      const extendedColumns = {
        kind: {
          get: (row: Maintenance) => row.addon.kind,
          header: 'Kind',
        },
        plan: {
          get: (row: Maintenance) => row.addon.plan,
          header: 'Plan',
        },
      }
      Object.assign(tableColumns, extendedColumns)
    }

    return tableColumns
  }

  private async fetchMaintenances(appName: string) {
    ux.action.start('Fetching maintenances')
    const {body: app} = await this.heroku.get<Heroku.App>(`/apps/${appName}`)
    const {body: {maintenances}} = await this.dataApi.get<{maintenances: Maintenance[]}>(
      `/data/maintenances/v1/apps/${app.id}`,
      this.dataApi.defaults,
    )
    ux.action.stop()

    return maintenances
  }

  private renderTable(maintenances: Maintenance[], tableColumns: Record<string, any>, flags: Record<string, any>) {
    const tableOptions = constructSortFilterTableOptions(flags, tableColumns)
    hux.table(maintenances, tableColumns, tableOptions)
  }
}
