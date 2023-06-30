import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

import {getPipeline} from '@heroku-cli/plugin-ci/lib/utils/pipelines'
import {displayTestRunInfo} from '@heroku-cli/plugin-ci/lib/utils/test-run'

export default class CiInfo extends Command {
  static description = 'show the status of a specific test run'

  static examples = [
    `$ heroku ci:info 1288 --app murmuring-headland-14719
`,
  ]

  static flags = {
    app: flags.string({char: 'a', description: 'app name'}),
    node: flags.string({description: 'the node number to show its setup and output', required: false}),
    pipeline: flags.pipeline({required: false}),
  }

  static args = [{name: 'test-run', required: true}]

  async run() {
    const {args, flags} = await this.parse(CiInfo)
    const pipeline = await getPipeline(flags, this)
    const {body: testRun} = await this.heroku.get<Heroku.TestRun>(`/pipelines/${pipeline.id}/test-runs/${args['test-run']}`)
    const {body: testNodes} = await this.heroku.get<Heroku.TestNode[]>(`/test-runs/${testRun.id}/test-nodes`)

    await displayTestRunInfo(this, testRun, testNodes, flags.node)
  }
}
