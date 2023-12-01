import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

export default class DoctorAsk extends Command {
  static description = 'recieve responses from HerokAI'
  static topic = 'doctor'

  static flags = {
    interactive: flags.boolean({description: 'use interactive mode with HerokAI', required: false}),
    json: flags.boolean({description: 'display doctor:ask input/output as json', required: false}),
  }

  static args = {
    question: Args.string({description: 'question to ask HerokAI', required: true}),
  }

  async run() {
    const {args, flags} = await this.parse(DoctorAsk)
    const {body: user} = await this.heroku.get<Heroku.Account>('/account', {retryAuth: false})
    const userName = (user && user.name) ? ` ${user.name}` : ''
    const herokAIResponse = `${color.heroku(`Hi${userName},`)} \n\nI'm just a concept right now. Remember?`

    const dialogue = {
      question: args.question,
      response: herokAIResponse,
    }

    if (flags.json) {
      ux.styledJSON(dialogue)
    } else {
      ux.log(herokAIResponse)
    }
  }
}
