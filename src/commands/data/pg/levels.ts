import {Command} from '@heroku-cli/command'
import * as hux from '@heroku/heroku-cli-util/hux'
import {printTable, TableOptions} from '@oclif/table'

import BaseCommand from '../../../lib/data/baseCommand.js'
import {PostgresLevelInfo, PostgresLevelsResponse} from '../../../lib/data/types.js'

export default class DataPgLevels extends BaseCommand {
  static baseFlags = Command.baseFlagsWithoutPrompt()
  static description = 'show available levels for Heroku Postgres Advanced databases'
  static promptFlagActive = false

  async run(): Promise<void> {
    const {body: {items: levels}} = await this.dataApi.get<PostgresLevelsResponse>('/data/postgres/v1/levels/advanced')

    hux.styledHeader('Available levels for Heroku Postgres Advanced databases')

    const defaultStyle = {
      borderColor: 'whiteBright',
      borderStyle: 'headers-only-with-underline',
      headerOptions: {
        bold: true,
        color: 'white',
      },
    } as Partial<TableOptions<PostgresLevelInfo>>

    printTable<PostgresLevelInfo>({
      columns: [
        {key: 'name', name: 'Name'},
        {horizontalAlignment: 'right', key: 'vcpu', name: 'vCPU'},
        {horizontalAlignment: 'right', key: 'memory_in_gb', name: 'Memory (GB)'},
        {horizontalAlignment: 'right', key: 'connection_limit', name: 'Max Connections'},
      ],
      data: levels,
      ...defaultStyle,
    })
  }
}
