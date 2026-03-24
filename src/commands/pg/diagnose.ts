import type {pg} from '@heroku/heroku-cli-util'

import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import * as hux from '@heroku/heroku-cli-util/hux'
import * as pgUtils from '@heroku/heroku-cli-util/utils/pg'
import {Args, ux} from '@oclif/core'

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
import tsheredoc from 'tsheredoc'

import type {
  PGDiagnoseCheck, PGDiagnoseRequest,
  PGDiagnoseResponse,
  PGDiagnoseResult,
} from '../../lib/pg/types.js'

import {essentialPlan} from '../../lib/pg/util.js'
import {uuidValidate} from '../../lib/utils/uuid-validate.js'

const heredoc = tsheredoc.default
const PGDIAGNOSE_HOST = process.env.PGDIAGNOSE_URL || 'pgdiagnose.herokai.com'

export default class Diagnose extends Command {
  static args = {
    'DATABASE|REPORT_ID': Args.string({description: 'config var exposed to the owning app containing the database URL or the report ID'}),
  }

  static description = heredoc(`
    run or view diagnostics report
    defaults to DATABASE_URL database if no DATABASE is specified
    if REPORT_ID is specified instead, a previous report is displayed

    `)

  static flags = {
    app: flags.app({required: true}),
    json: flags.boolean({description: 'format output as JSON'}),
    remote: flags.remote(),
  }

  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Diagnose)

    const id = args['DATABASE|REPORT_ID']
    let report: PGDiagnoseResponse
    if (id && uuidValidate(id)) {
      ({body: report} = await this.heroku.get<PGDiagnoseResponse>(`/reports/${encodeURIComponent(id)}`, {hostname: PGDIAGNOSE_HOST}))
    } else {
      report = await this.generateReport(id, flags.app)
    }

    this.displayReport(report, flags.json)
  }

  private display(checks: PGDiagnoseCheck[]) {
    checks.forEach((check: PGDiagnoseCheck) => {
      const colorFn = color[check.status] || ((txt: string) => txt)
      ux.stdout(colorFn(`${check.status.toUpperCase()}: ${check.name}`))
      const isNonEmptyArray = Array.isArray(check.results) && check.results.length > 0
      const resultsKeys = Object.keys(check.results ?? {})
      if (check.status === 'green' || (!isNonEmptyArray && resultsKeys.length === 0)) {
        return
      }

      if (isNonEmptyArray) {
        const keys = Object.keys(check.results[0]) as (keyof PGDiagnoseResult)[]
        const cols = {} as Record<string, {get: (row: PGDiagnoseResult) => string}>
        keys.forEach((key: number | string | symbol) => {
          const keyStr = String(key)
          cols[capitalize(keyStr)] = {
            get: (row: PGDiagnoseResult): string => String(row[key as keyof PGDiagnoseResult]),
          }
        })
        hux.table(check.results, cols)
      } else {
        const [key] = resultsKeys
        ux.stdout(`${key.split('_')
          .map(s => capitalize(s))
          .join(' ')} ${check.results[key as keyof PGDiagnoseResult]}`)
      }
    })
  }

  private displayReport(report: PGDiagnoseResponse, json: boolean) {
    if (json) {
      hux.styledJSON(report)
      return
    }

    ux.stdout(`Report ${report.id} for ${report.app}::${report.database}\navailable for one month after creation on ${report.created_at}\n`)

    this.display(report.checks.filter((c: PGDiagnoseCheck) => c.status === 'red'))
    this.display(report.checks.filter((c: PGDiagnoseCheck) => c.status === 'yellow'))
    this.display(report.checks.filter((c: PGDiagnoseCheck) => c.status === 'green'))
    this.display(report.checks.filter((c: PGDiagnoseCheck) => !['green', 'red', 'yellow'].includes(c.status)))
  }

  private async generateParams(url: string, db: pg.ExtendedAddonAttachment['addon'], dbName: string): Promise<PGDiagnoseRequest> {
    const base_params: PGDiagnoseRequest = {
      app: db.app.name as string,
      database: dbName,
      plan: db.plan.name.split(':')[1],
      url,
    }
    if (!essentialPlan(db)) {
      const {body: metrics} = await this.heroku.get<unknown[]>(`/client/v11/databases/${db.id}/metrics`, {hostname: pgUtils.getHost()})
      base_params.metrics = metrics
      const {body: burstData} = await this.heroku.get<{
        burst_status: string
      }>(`/client/v11/databases/${db.id}/burst_status`, {hostname: pgUtils.getHost()})
      if (burstData && Object.keys(burstData).length > 0) {
        base_params.burst_data_present = true
        base_params.burst_status = burstData.burst_status
      }
    }

    return base_params
  }

  private async generateReport(database: string | undefined, app: string) {
    const dbResolver = new pgUtils.DatabaseResolver(this.heroku)
    const attachment = await dbResolver.getAttachment(app, database)
    const {addon: db} = attachment
    const {body: config} = await this.heroku.get<Record<string, string>>(`/apps/${app}/config-vars`)
    const {url} = dbResolver.getConnectionDetails(attachment, config)
    const dbName = pgUtils.getConfigVarNameFromAttachment(attachment, config)
    const body = await this.generateParams(url, db, dbName)
    const {body: report} = await this.heroku.post<PGDiagnoseResponse>('/reports', {body, hostname: PGDIAGNOSE_HOST})

    return report
  }
}
