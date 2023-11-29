/* eslint-disable prefer-const */
import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import {sortBy} from 'lodash'
const exec = require('child_process').exec

const getLocalNodeVersion = () => {
  exec('node -v',
    (error: any, stdout: any) => {
      if (error !== null) {
        return 'unavailable'
      }

      return stdout
    })
}

const getInstallMethod = () => {
  return 'brew'
}

const getLocalProxySettings = (unmasked = false) => {
  if (unmasked) {
    return null
  }

  return 'xxxxx.proxy'
}

export default class DoctorVitals extends Command {
  static description = 'list local user setup for debugging'
  static topic = 'doctor'

  static flags = {
    unmasked: flags.boolean({required: false}),
    json: flags.boolean({description: 'display as json', required: false}),
  }

  async run() {
    const {flags} = await this.parse(DoctorVitals)
    const time = new Date()
    const dateChecked = time.toISOString().split('T')[0]
    const cliInstallMethod = getInstallMethod()
    const os = this.config.platform
    const cliVersion = `v${this.config.version}`
    const nodeVersion = getLocalNodeVersion()
    const networkConfig = {
      httpsProxy: getLocalProxySettings(flags.unmasked),
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
