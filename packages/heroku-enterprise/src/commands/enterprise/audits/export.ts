import {color} from '@heroku-cli/color'
import {flags} from '@heroku-cli/command'
import axios from 'axios'
import cli from 'cli-ux'
import * as fs from 'fs'
import * as inquirer from 'inquirer'
import * as _ from 'lodash'
import * as Path from 'path'

import BaseCommand from '../../../base'
import {Accounts, Archives} from '../../../completions'
import {CoreService} from '../../../core-service'
import Utils from '../../../utils'

export default class Export extends BaseCommand {
  static description = 'export an audit log for an enterprise account'
  static examples = [
    '$ heroku enterprise:audits:export 2018-11 --enterprise-account=account-name',
    '$ heroku enterprise:audits:export 2018-11 --enterprise-account=account-name --dest=/tmp',
    '$ heroku enterprise:audits:export 2018-11 --enterprise-account=account-name --dest=/tmp/audit_report.json.gz',
    '$ heroku enterprise:audits:export 2018-11 --enterprise-account=account-name --dest=/tmp/audit_report.json.gz --force',
  ]
  static args = [
    {name: 'log', description: 'audit log date (YYYY-MM)', required: false, completion: Archives},
  ]
  static flags = {
    'enterprise-account': flags.string({
      char: 'e',
      description: 'enterprise account name',
      required: true,
      completion: Accounts
    }),
    dest: flags.string({
      char: 'd',
      description: 'download destination for the exported audit log',
      required: false
    }),
    force: flags.boolean({
      char: 'f',
      description: 'overwrite existing file during download',
      required: false
    })
  }

  async run() {
    const {args, flags} = this.parse(Export)
    const coreService: CoreService = new CoreService(this.heroku)

    const accountId = await coreService.getEnterpriseAccountId(flags['enterprise-account'])
    const logYearMonth = await this.getAuditLogYearMonth(args, accountId)
    const headers: any = {headers: {Accept: 'application/vnd.heroku+json; version=3.audit-trail'}}
    const {body: archive} = await this.heroku.get<any>(`/enterprise-accounts/${accountId}/archives/${logYearMonth[0]}/${logYearMonth[1]}`, headers)

    const filePath = await this.getFilePath(flags, logYearMonth)
    const formattedFilePath = color.cyan(filePath)
    const fileStream = fs.createWriteStream(filePath)
    fileStream.on('error', err => {
      fileStream.end()
      cli.error(err)
    })

    const response = await axios({
      method: 'GET',
      url: archive.url,
      responseType: 'stream'
    })

    const total = parseInt(response.headers['content-length']!, 10)
    let current = 0

    response.data.pipe(fileStream)

    cli.action.start(`Downloading audit log to ${formattedFilePath}`)
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

  /*
    Three things can happen when trying to calculate the correct path:
    1) The user specifies a directory.
       - In this case, we simply append the default filename to the path
    2) The user specifies an existing file
       - In this case, use the entire path of the file
    3) The user specifies a completely new file path
       - In this case, an error is thrown because it doesn't exist yet.  Still, we'll assume the path is valid.
   */
  private async getFilePath(flags: any, logYearMonth: string[]): Promise<string> {
    const defaultPath = `enterprise-audit-log-${flags['enterprise-account']}-${logYearMonth[0]}${logYearMonth[1]}.json.gz`
    if (flags.dest) {
      try {
        if (fs.statSync(flags.dest).isDirectory()) {
          return `${Path.join(flags.dest, defaultPath)}`
        }
        if (!flags.force && !await cli.confirm(`Overwrite exiting file: ${flags.dest}?`)) {
          process.exit(1)
        }
        return flags.dest
      } catch {
        return flags.dest
      }
    }

    return defaultPath
  }

  private updateStatus(newStatus: string) {
    _.throttle(
      (newStatus: string) => {
        cli.action.status = newStatus
      },
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

  private async getAuditLogChoices(enterpriseAccountId: string): Promise<{ name: string }[]> {
    const headers = {headers: {Accept: 'application/vnd.heroku+json; version=3.audit-trail'}}
    const {body: archives} = await this.heroku.get<any[]>(`/enterprise-accounts/${enterpriseAccountId}/archives`, headers)
    const auditChoices: { name: string }[] = []
    archives.forEach(archives => auditChoices.push({
      name: `${archives.year}-${archives.month}`
    }))

    return auditChoices
  }
}
