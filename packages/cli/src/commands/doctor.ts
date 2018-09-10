import {Command} from '@heroku-cli/command'

export default class extends Command {
  static description = 'debugging output for Heroku support tickets'

  static examples = [
    '$ heroku doctor',
  ]

  static flags = {
  }

  async run() {
    // version
    this.log(this.config.userAgent)
    // heroku env vars
    let envVars = []
    for (let envs of Object.keys(process.env)) {
      if (envs.match(/^HEROKU_/)) envVars.push(envs)
    }
    this.log(envVars.length ? envVars.join(', ') : '(no env vars set)')
  }
}
