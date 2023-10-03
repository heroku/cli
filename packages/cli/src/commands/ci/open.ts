import {Command, flags} from '@heroku-cli/command'
import * as open from 'open'
import {getPipeline} from '../../lib/ci/pipelines'

export default class CiOpen extends Command {
  static description = 'open the Dashboard version of Heroku CI'
  static topic = 'ci'
  static examples = [
    '$ heroku ci:open --app murmuring-headland-14719',
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    app: flags.app({required: true}),
    pipeline: flags.pipeline({required: false}),
  }

  async run() {
    const {flags} = await this.parse(CiOpen)
    const pipeline = await getPipeline(flags, this)
    await open(`https://dashboard.heroku.com/pipelines/${pipeline.id}/tests`)
  }
}
