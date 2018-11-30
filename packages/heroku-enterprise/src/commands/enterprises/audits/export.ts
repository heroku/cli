import {color} from '@heroku-cli/color'
import {flags as Flags} from '@heroku-cli/command'
import axios from 'axios'
import cli from 'cli-ux'
import * as fs from 'fs'
import * as inquirer from 'inquirer'
import * as _ from 'lodash'

import BaseCommand from '../../../base'
import Utils from '../../../utils'

export default class Export extends BaseCommand {
  static description = 'export an audit log for an enterprise account'
  static examples = [
    '$ heroku enterprises:audits:export 2018-11 --enterprise-account=account-name',
  ]
  static args = [
    {name: 'log', description: 'audit log date (YYYY-MM)', required: false},
  ]
  static flags = {
    'enterprise-account': Flags.string({
      char: 'e',
      description: 'enterprise account name',
      required: true
    })
  }

  async run() {
    const {args, flags} = this.parse(Export)
    const accountId = await this.getAccountId(flags['enterprise-account'])
    const logYearMonth = await this.getAuditLogYearMonth(args, accountId)

    const headers: any = {headers: {Accept: 'application/vnd.heroku+json; version=3.audit-trail'}}
    const {body: archive} = await this.heroku.get<any>(`/enterprise-accounts/${accountId}/archives/${logYearMonth[0]}/${logYearMonth[1]}`, headers)

    const filePath = `enterprise-audit-log-${flags['enterprise-account']}-${logYearMonth[0]}${logYearMonth[1]}.json.gz`
    const formattedFilePath = color.cyan(filePath)
    const fileStream = fs.createWriteStream(filePath)

    cli.action.start(`Downloading audit log to ${formattedFilePath}`)
    const response = await axios({
      method: 'GET',
      url: archive.url,
      responseType: 'stream'
    })

    const total = parseInt(response.headers['content-length']!, 10)
    let current = 0

    response.data.pipe(fileStream)
    await new Promise((resolve, reject) => {
      response.data.on('data', (data: any) => {
        current += data.length
        this.updateStatus(`${Utils.filesize(current)}/${Utils.filesize(total)}`)
      })
      response.data.on('end', () => {
        resolve()
      })
      response.data.on('error', () => {
        reject()
      })
    })
    cli.action.stop()

    if (!await Utils.hasValidChecksum(filePath, archive.checksum)) {
      cli.error('Invalid checksum, please try again.')
    }
  }

  private updateStatus(newStatus: string) {
    _.throttle(
      (newStatus: string) => { cli.action.status = newStatus },
      250,
      {leading: true, trailing: false},
    )(newStatus)
  }

  private async getAuditLogYearMonth(args: any, accountId: string): Promise<string[]> {
    let logYearMonth: string[]
    if (!args.log) {
      const responses: any = await inquirer.prompt([{
        name: 'log',
        message: 'select a audit log',
        type: 'list',
        choices: await this.getAuditLogChoices(accountId),
      }])
      logYearMonth = responses.log.split('-')
    } else {
      logYearMonth = args.log.split('-')
    }

    return logYearMonth
  }

  private async getAuditLogChoices(enterpriseAccountId: string): Promise<{name: string}[]> {
    const headers = {headers: {Accept: 'application/vnd.heroku+json; version=3.audit-trail'}}
    const {body: archives} = await this.heroku.get<any[]>(`/enterprise-accounts/${enterpriseAccountId}/archives`, headers)
    const auditChoices: {name: string}[] = []
    archives.forEach(archives => auditChoices.push({
      name: `${archives.year}-${archives.month}`
    }))

    return auditChoices
  }

  private async getAccountId(enterpriseAccount: string): Promise<string> {
    const {body} = await this.heroku.get<any>(`/enterprise-accounts/${enterpriseAccount}`)
    return body.id
  }
}
