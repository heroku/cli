import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import * as lodash from 'lodash'
const clipboard = require('copy-paste')
const {exec} = require('child_process')
const {promisify} = require('util')
const execAsync = promisify(exec)

export default class DoctorRecommend extends Command {
  static description = 'recieve the latest tips, general playbooks, and resources when encountering cli issues'
  static topic = 'doctor'
  static examples = [
    '$ heroku doctor:recommend <command>',
    '$ heroku doctor:recommend --type command "Command will not show output"',
    '$ heroku doctor:recommend --type install "Cli is erroring during install"',
    '$ heroku doctor:recommend --type error "I get an error when running..."',
    '$ heroku doctor:recommend --type network "I can not push my latest release"',
    '$ heroku doctor:recommend --type permissions "I cannot get access to..."',
  ]

  static args = {
    statement: Args.string({description: 'statement of problem user is enountering', required: true}),
  }

  static flags = {
    type: flags.string({description: 'type of help required', required: false}),
    'copy-results': flags.boolean({description: 'copies results to clipboard', required: false}),
  }

  async run() {
    const {flags} = await this.parse(DoctorRecommend)
    ux.log(`${color.bold(`${color.heroku('Recommendations')}`)}`)
    ux.log(`${color.bold(`${color.heroku('-------------------------------------------')}`)}`)
    ux.log(`- Visit ${color.cyan('"https://devcenter.heroku.com/articles/heroku-cli"')} for more install information`)
    ux.log('- Try reinstalling the heroku cli')
    ux.log(`- Try running ${color.cyan('"$ heroku doctor:diagnose"')}`)
    ux.log(`- Try running ${color.cyan('"$ heroku doctor:ask"')}`)
    ux.log('- Check which version of the heroku cli your are running')
  }
}
