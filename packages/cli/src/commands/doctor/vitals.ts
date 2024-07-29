import {Command} from '@heroku-cli/command'

export class DoctorVitals extends Command {
  static description = "display information about the user's local machine setup"
  
  async run(): Promise<void> {
    console.log('running doctor:vitals command...')
    console.log("----------- this.heroku -----------")
    console.log(this.heroku.defaults)
  }
}