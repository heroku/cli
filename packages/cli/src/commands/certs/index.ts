import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {all} from '../../lib/certs/endpoints'
import displayTable from '../../lib/certs/display_table'
import * as Heroku from '@heroku-cli/schema'

export default class Index extends Command {
  static topic = 'certs';
  static description = 'list SSL certificates for an app';
  static flags = {
    app: flags.app({required: true}),
  };

  public async run(): Promise<void> {
    const {flags} = await this.parse(Index)
    const certs = await all(flags.app, this.heroku)

    if (certs.length === 0) {
      ux.log(`${color.magenta(flags.app)} has no SSL certificates.\nUse ${color.cyan.bold('heroku certs:add CRT KEY')} to add one.`)
    } else {
      const sortedCerts = certs.sort((a: Heroku.SniEndpoint, b: Heroku.SniEndpoint) => {
        const aName = a?.name || ''
        const bName = b?.name || ''
        return (aName > bName) ? 1 : ((bName > aName) ? -1 : 0)
      })
      displayTable(sortedCerts)
    }
  }
}
