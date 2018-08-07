
import {Command, flags} from '@heroku-cli/command'

import * as HerokuCI from '../../lib/interface'
import {getPipeline} from '../../lib/utils/pipelines'

export default class Info extends Command {
  static description = 'show the status of a specific test run'

  static examples = [
    `$ heroku ci:info 1288 --app murmuring-headland-14719
`,
  ]

  static flags = {
    app: flags.app({required: false}),
    node: flags.string({description: 'the node number to show its setup and output', required: false}),
    pipeline: flags.pipeline({required: false})
  }

  static args = [{name: 'test-run', required: true}]

  async run() {
    const {args, flags} = this.parse(Info)

    const pipeline = await getPipeline(flags, this)
    const headers = {Accept: 'application/vnd.heroku+json; version=3.ci'}

    try {
      const {body: testRun} = await this.heroku.get<HerokuCI.TestRun>(`/pipelines/${pipeline.id}/test-runs/${args['test-run']}`, {headers})
      const {body: testNodes} = await this.heroku.get(`/test-runs/${testRun.id}/test-nodes`, {headers})

      this.log(testRun)
      this.log(testNodes)

    } catch (e) {
      this.error(e.body.message) // This currently shows a  ›   Error: Not found.
    }

    //  if (flags.node) {
    //   if (testNodes.length > 1) {
    //     testNode = testNodes[flags.node]

    //     if (!testNode) {
    //       cli.error(`There isn't a test node ${flags.node} for test run ${args['test-run']}`)
    //     }
    //   } else {
    //     testNode = testNodes[0]
    //   }

    //   await renderNodeOutput(testRun, testNode)

    //   if (testNodes.length === 1) {
    //     this.log(/* newline 💃 */)
    //     this.warn('This pipeline doesn\'t have parallel test runs, but you specified a node')
    //     this.warn('See https://devcenter.heroku.com/articles/heroku-ci-parallel-test-runs for more info')
    //   }
    //   process.exit(testNode.exit_code)
    // } else {
    //   if (testNodes.length > 1) {
    //     this.log(RenderTestRuns.printLine(testRun))
    //     this.log(/* newline 💃 */)
    //     testNodes.forEach((testNode) => {
    //       this.log(RenderTestRuns.printLineTestNode(testNode))
    //     })
    //   } else {
    //     testNode = testNodes[0]
    //     await renderNodeOutput(testRun, testNode);
    //     process.exit(testNode.exit_code)
    //   }
    // }

    // if node is specified, show output and setup stream url for that node
    // if no node is specified, show minimal information
  }
}
