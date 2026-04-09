import * as color from '@heroku/heroku-cli-util/color'
import tsheredoc from 'tsheredoc'

import DataPgWait from '../wait.js'

const heredoc = tsheredoc.default

export default class DataPgUpgradeWait extends DataPgWait {
  static description = 'shows status of an upgrade until it\'s complete'

  static examples = [
    heredoc(`
      # Wait for upgrade to complete
      ${color.code('<%= config.bin %> <%= command.id %> DATABASE --app myapp')}
    `),
    heredoc(`
      # Wait with custom polling interval (to avoid rate limiting)
      ${color.code('<%= config.bin %> <%= command.id %> DATABASE --app myapp --wait-interval 10')}
    `),
  ]

  protected classicWaitCommand: string = 'pg:upgrade:wait'
}
