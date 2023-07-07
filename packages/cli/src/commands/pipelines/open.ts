import {Command} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import * as open from 'open'

import disambiguate from '../../lib/pipelines/disambiguate'

export default class Open extends Command {
  static description = 'open a pipeline in dashboard'

  static examples = ['$ heroku pipelines:open my-pipeline']

  static args = {
    pipeline: Args.string({description: 'name of pipeline', required: true}),
  }

  // this only exists because of difficulty stubbing open in tests
  private async open(url: string): ReturnType<typeof open> {
    return open(url)
  }

  async run() {
    const {args} = await this.parse(Open)

    const pipeline: any = await disambiguate(this.heroku, args.pipeline)
    await this.open(`https://dashboard.heroku.com/pipelines/${pipeline.id}`)
  }
}
