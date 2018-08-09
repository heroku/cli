import * as Heroku from '@heroku-cli/schema'

import {Command, flags} from '@heroku-cli/command'

import {getPipeline} from '../../lib/utils/pipelines'
import {displayTestRunInfo} from '../../lib/utils/test-run'

export default class CiLast extends Command {
  static description = 'looks for the most recent run and returns the output of that run'

  static examples = [
    `$ heroku ci:last --app murmuring-headland-14719 --node 100
`,
  ]

  static flags = {
    app: flags.app({required: false}),
    node: flags.string({description: 'the node number to show its setup and output', required: false}),
    pipeline: flags.pipeline({required: false})
  }

  async run() {
    const {flags} = this.parse(CiLast)
    const pipeline = await getPipeline(flags, this)

    try {
      const headers = {Range: 'number ..; order=desc,max=1'}
      const {body: latestTestRun} = await this.heroku.get<Heroku.TestRun>(`/pipelines/${pipeline.id}/test-runs`, {headers})
      const {body: testRun} = await this.heroku.get<Heroku.TestRun>(`/pipelines/${pipeline.id}/test-runs/${latestTestRun[0].number}`)
      const {body: testNodes} = await this.heroku.get<Heroku.TestNode[]>(`/test-runs/${testRun.id}/test-nodes`)

      await displayTestRunInfo(this, testRun, testNodes, flags.node)
    } catch (e) {
      this.error(e.body.message) // This currently shows a  ›   Error: Not found.
    }
  }
}
