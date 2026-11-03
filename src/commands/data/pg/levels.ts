import type {PostgresLevelInfoResult} from '@heroku/types/data'

import {Command} from '@heroku-cli/command'
import {hux} from '@heroku/heroku-cli-util'
import {printTable, TableOptions} from '@oclif/table'

import BaseCommand from '../../../lib/data/base-command.js'
import {createSDK} from '../../../lib/sdk.js'

type PostgresLevelItem = PostgresLevelInfoResult['items'][number]

export default class DataPgLevels extends BaseCommand {
  static baseFlags = Command.baseFlagsWithoutPrompt()
  static description = 'show available levels for Heroku Postgres Advanced databases'
  static promptFlagActive = false

  async run(): Promise<PostgresLevelItem[]> {
    const {data} = createSDK(this.heroku)
    const {items: levels} = await data.postgresLevel.info('advanced')

    hux.styledHeader('Available levels for Heroku Postgres Advanced databases')

    const defaultStyle = {
      borderColor: 'whiteBright',
      borderStyle: 'headers-only-with-underline',
      headerOptions: {
        bold: true,
        color: 'white',
      },
    } as Partial<TableOptions<PostgresLevelItem>>

    printTable<PostgresLevelItem>({
      columns: [
        {key: 'name', name: 'Name'},
        {horizontalAlignment: 'right', key: 'vcpu', name: 'vCPU'},
        {horizontalAlignment: 'right', key: 'memory_in_gb', name: 'Memory (GB)'},
        {horizontalAlignment: 'right', key: 'connection_limit', name: 'Max Connections'},
      ],
      data: levels,
      ...defaultStyle,
    })

    return levels
  }
}
