/* eslint-disable prefer-const */
import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import {sortBy} from 'lodash'
const {exec} = require('child_process');
const {promisify} = require('util')
const execAsync = promisify(exec)

const getLocalNodeVersion = async () => {
  const {stdout} = await execAsync('node -v')
  return stdout
}

const getInstallMethod = () => {
  return 'brew'
}

const getInstallLocation = async () => {
  const {stdout} = await execAsync('which heroku')
  const formattedOutput = stdout.replace(/\n/g, '')
  return formattedOutput
}

const getLocalProxySettings = async (unmasked = false) => {
  const {stdout} = await execAsync('scutil --proxy')

  if (unmasked) {
    return stdout
  }

  return 'xxxxx.proxy\n'
}

const getInstalledPLugins = async () => {
  const {stdout} = await execAsync('heroku plugins')
  return stdout
}

const getHerokuStatus = async () => {
  const {stdout} = await execAsync('heroku status')
  return stdout
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
    const cliInstallLocation = await getInstallLocation()
    const os = this.config.platform
    const cliVersion = `v${this.config.version}`
    const nodeVersion = await getLocalNodeVersion()
    const networkConfig = {
      httpsProxy: await getLocalProxySettings(flags.unmasked),
    }
    const installedPlugins = await getInstalledPLugins()
    const herokuStatus = await getHerokuStatus()

    const isHerokuUp = true

    ux.styledHeader(`${color.heroku('Heroku CLI Doctor')} · ${color.cyan(`User Local Setup on ${dateChecked}`)}`)
    ux.log(`${color.cyan('CLI Install Method:')} ${cliInstallMethod}`)
    ux.log(`${color.cyan('CLI Install Location:')} ${cliInstallLocation}`)
    ux.log(`${color.cyan('OS:')} ${os}`)
    ux.log(`${color.cyan('Heroku CLI Version:')} ${cliVersion}`)
    ux.log(`${color.cyan('Node Version:')} ${nodeVersion}`)

    ux.log(`${color.cyan('Network Config')}`)
    ux.log(`HTTPSProxy: ${networkConfig.httpsProxy}`)

    ux.log(`${color.cyan('Installed Plugins')}`)
    ux.log(`${installedPlugins}`)

    ux.log(`${color.heroku('Heroku Status')}`)
    ux.log(`${color.heroku('----------------------------------------')}`)
    ux.log(isHerokuUp ? color.green(herokuStatus) : color.red(herokuStatus))
  }
}
