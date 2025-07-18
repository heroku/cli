/*
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args} from '@oclif/core'

import {getPipeline} from '../../lib/ci/pipelines.js'
import {displayTestRunInfo} from '../../lib/ci/test-run.js'

export default class CiInfo extends Command {
  static description = 'show the status of a specific test run'

  static examples = [
    `$ heroku ci:info 1288 --app murmuring-headland-14719
`,
  ]

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    node: flags.string({description: 'the node number to show its setup and output', required: false}),
    pipeline: flags.pipeline({required: false}),
  }

  static args = {
    'test-run': Args.string({required: true, description: 'auto-incremented test run number'}),
  }

  async run() {
    const {args, flags} = await this.parse(CiInfo)
    const pipeline = await getPipeline(flags, this.heroku)
    const {body: testRun} = await this.heroku.get<Heroku.TestRun>(`/pipelines/${pipeline.id}/test-runs/${args['test-run']}`)
    const {body: testNodes} = await this.heroku.get<Heroku.TestNode[]>(`/test-runs/${testRun.id}/test-nodes`)

    await displayTestRunInfo(this, testRun, testNodes, flags.node)
  }
}
*/
