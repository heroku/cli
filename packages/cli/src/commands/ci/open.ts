import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import open from 'open'
import {getPipeline} from '../../lib/ci/pipelines.js'

export default class CiOpen extends Command {
  static description = 'open the Dashboard version of Heroku CI'
  static topic = 'ci'
  static examples = [
    color.command('heroku ci:open --app murmuring-headland-14719'),
  ]

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    pipeline: flags.pipeline({required: false}),
  }

  async run() {
    const {flags} = await this.parse(CiOpen)
    const pipeline = await getPipeline(flags, this.heroku)
    await open(`https://dashboard.heroku.com/pipelines/${pipeline.id}/tests`)
  }
}
