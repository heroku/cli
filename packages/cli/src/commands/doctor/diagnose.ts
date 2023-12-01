import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import * as lodash from 'lodash'
const clipboard = require('copy-paste')
const {exec} = require('child_process')
const {promisify} = require('util')
const execAsync = promisify(exec)

export default class DoctorDiagnose extends Command {
  static description = 'check the heroku cli build for errors'
  static topic = 'doctor'

  static args = {
    command: Args.string({description: 'command to check for errors', required: false}),
  }

  static flags = {
    all: flags.boolean({description: 'check all commands for errors', required: false, char: 'A'}),
    build: flags.boolean({description: 'check entire heroku cli build for errors', required: false, char: 'b'}),
    'copy-results': flags.boolean({description: 'copies results to clipboard', required: false, char: 'p'}),
    json: flags.boolean({description: 'display as json', required: false}),
  }

  async run() {
    const {args, flags} = await this.parse(DoctorDiagnose)
    const errorMessage = 'H23'
    const stackMessage = 'some/crazy/looking/stack/message'

    ux.action.start(`${color.heroku(`Running diagnostics on ${color.cyan(`${args.command}`)}`)}`)
    ux.action.stop()
    ux.action.start(`${color.heroku(`Writing up report on ${color.cyan(`${args.command}`)}`)}`)
    ux.action.stop()

    ux.log('\n')
    ux.log(`${color.bold(`${color.heroku('Report')}`)}`)
    ux.log(`${color.bold(`${color.heroku('-------------------------------------------')}`)}`)
    ux.log(`${color.cyan('Error:')} ${errorMessage}`)
    ux.log(`${color.cyan('Stack:')} ${stackMessage}`)
  }
}
