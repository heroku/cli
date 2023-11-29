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
    let cliInstallMethod = 'brew'
    let os = this.config.platform
    let cliVersion = `v${this.config.version}`
    let nodeVersion = 'v16.19.0'
    let networkConfig = {
      httpsProxy: null,
    }
    let installedPlugins = 'myplugin'
    let herokuStatus = {
      apps: 'No known issues at this time.',
      data: 'No known issues at this time.',
      tools: 'No known issues at this time.',
    }

    const appsUp = true
    const dataUp = true
    const toolsUp = true

    ux.styledHeader(`${color.heroku('Heroku CLI Doctor')} · ${color.cyan(`User Local Setup on ${dateChecked}`)}`)
    ux.log(`${color.cyan('CLI Install Method:')} ${cliInstallMethod}`)
    ux.log(`${color.cyan('OS:')} ${os}`)
    ux.log(`${color.cyan('Heroku CLI Version:')} ${cliVersion}`)
    ux.log(`${color.cyan('Node Version:')} ${nodeVersion}`)
    ux.log(`${color.cyan('Network Config:')}`)
    ux.log(`- ${color.cyan('HTTPSProxy:')} ${networkConfig.httpsProxy}`)
    ux.log(`${color.cyan('Installed Plugins:')}`)
    ux.log(`- ${installedPlugins}`)
    ux.log('\n')

    ux.log(`${color.heroku('Heroku Status')}`)
    ux.log(`${color.heroku('----------------------------------------')}`)
    ux.log(`${appsUp ? color.green(`App: ${herokuStatus.apps}`) : color.red(`App: ${herokuStatus.apps}`)}`)
    ux.log(`${dataUp ? color.green(`Data: ${herokuStatus.data}`) : color.red(`Data: ${herokuStatus.data}`)}`)
    ux.log(`${toolsUp ? color.green(`Tools: ${herokuStatus.tools}`) : color.red(`Tools: ${herokuStatus.tools}`)}`)
  }
}
