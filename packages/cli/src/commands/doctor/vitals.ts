/* eslint-disable prefer-const */
import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import {sortBy} from 'lodash'

export default class DoctorVitals extends Command {
  static description = 'list local user setup for debugging'
  static topic = 'doctor'

  //   static flags = {
  //     app: flags.app({required: false}),
  //     json: flags.boolean({description: 'display as json', required: false}),
  //   }

  async run() {
    const {args, flags} = await this.parse(DoctorVitals)
    const time = new Date()
    let dateChecked = time.toISOString().split('T')[0]
    let cliInstallMethod = null
    let os = null
    let cliVersion = null
    let nodeVersion = null
    let networkConfig = {
      httpsProxy: null,
    }
    let installedPlugins = null
    let herokuStatus = {
      apps: 'No known issues at this time.',
      data: 'No known issues at this time.',
      tools: 'No known issues at this time.',
    }

    const appsUp = true
    const dataUp = true
    const toolsUp = true

    ux.styledHeader(`${color.heroku('Heroku CLI Doctor')} · ${color.cyan(`User Local Setup on ${dateChecked}`)}`)
    ux.log(`CLI Install Method: ${cliInstallMethod}`)
    ux.log(`OS: ${os}`)
    ux.log(`Heroku CLI Version: ${cliVersion}`)
    ux.log(`Node Version: ${nodeVersion}`)
    ux.log('Network Config:')
    ux.log(`- HTTPSProxy: ${networkConfig.httpsProxy}`)
    ux.log('Installed Plugins:')
    ux.log(`- ${installedPlugins}`)
    ux.log('\n')

    ux.log(`${color.heroku('Heroku Status')}`)
    ux.log(`${color.heroku('----------------------------------------')}`)
    ux.log(`${appsUp ? color.green(`App: ${herokuStatus.apps}`) : color.red(`App: ${herokuStatus.apps}`)}`)
    ux.log(`${dataUp ? color.green(`Data: ${herokuStatus.data}`) : color.red(`Data: ${herokuStatus.data}`)}`)
    ux.log(`${toolsUp ? color.green(`Tools: ${herokuStatus.tools}`) : color.red(`Tools: ${herokuStatus.tools}`)}`)
  }
}
