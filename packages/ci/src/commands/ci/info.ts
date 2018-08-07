import color from '@heroku-cli/color'

import {Command, flags} from '@heroku-cli/command'

import * as HerokuCI from '../../lib/interface'
import {getPipeline} from '../../lib/utils/pipelines'

class TestRun {
  testNodes: Array<HerokuCI.TestNode>

  constructor(testNodes: Array<HerokuCI.TestNode>) {
    this.testNodes = testNodes
  }

  hasParallelTestRuns() {
    return this.testNodes.length > 1
  }
}

function stream(url) {
  return new Promise((resolve, reject) => {
    const request = api.logStream(url, output => {
      output.on('data', data => {
        if (data.toString() === new Buffer('\0').toString()) {
          request.abort()
          resolve()
        }
      })

      output.on('end', () => resolve())
      output.on('error', e => reject(e))
      output.pipe(process.stdout)
    })
  })
}

const PENDING = 'pending'
const CREATING = 'creating'
const BUILDING = 'building'
const RUNNING = 'running'
const DEBUGGING = 'debugging'
const ERRORED = 'errored'
const FAILED = 'failed'
const SUCCEEDED = 'succeeded'
const CANCELLED = 'cancelled'

const STATUS_ICONS = {
  [PENDING]: '⋯',
  [CREATING]: '⋯',
  [BUILDING]: '⋯',
  [RUNNING]: '⋯',
  [DEBUGGING]: '⋯',
  [ERRORED]: '!',
  [FAILED]: '✗',
  [SUCCEEDED]: '✓',
  [CANCELLED]: '!'
}

const STATUS_COLORS = {
  [PENDING]: 'yellow',
  [CREATING]: 'yellow',
  [BUILDING]: 'yellow',
  [RUNNING]: 'yellow',
  [DEBUGGING]: 'yellow',
  [ERRORED]: 'red',
  [FAILED]: 'red',
  [SUCCEEDED]: 'green',
  [CANCELLED]: 'yellow'
}

function statusIcon({status}) {
  return color[STATUS_COLORS[status] || 'yellow'](STATUS_ICONS[status] || '-')
}

function printLine(testRun) {
  return `${statusIcon(testRun)} #${testRun.number} ${testRun.commit_branch}:${testRun.commit_sha.slice(0, 7)} ${testRun.status}`
}

function printLineTestNode(testNode) {
  return `${statusIcon(testNode)} #${testNode.index} ${testNode.status}`
}

async function renderNodeOutput(command: Command, testRun: TestRun, testNode: HerokuCI.TestNode) {
  await stream(testNode.setup_stream_url)
  await stream(testNode.output_stream_url)

  command.log()
  command.log(printLine(testRun))
}

async function displayTestRunInfo(command: Command, testRun: TestRun, nodeIndex: number) {
  let testNode: HerokuCI.TestNode

  if (nodeIndex) {
    testNode = testRun.hasParallelTestRuns() ? testRun.testNodes[nodeIndex] : testRun.testNodes[0]

    await renderNodeOutput(command, testRun, testNode)

    if (!testRun.hasParallelTestRuns()) {
      command.log()
      command.warn('This pipeline doesn\'t have parallel test runs, but you specified a node')
      command.warn('See https://devcenter.heroku.com/articles/heroku-ci-parallel-test-runs for more info')
    }
    process.exit(testNode.exit_code)
  } else {
    if (testRun.hasParallelTestRuns()) {
      command.log(printLine(testRun))
      command.log()

      testRun.testNodes.forEach(testNode => {
        command.log(printLineTestNode(testNode))
      })
    } else {
      testNode = testRun.testNodes[0]
      await renderNodeOutput(command, testRun, testNode)
      process.exit(testNode.exit_code)
    }
  }
}
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
      const {body: testNodes} = await this.heroku.get<HerokuCI.TestNode[]>(`/test-runs/${testRun.id}/test-nodes`, {headers})

      const pipelineTestRun = new TestRun(testNodes)
      await displayTestRunInfo(this, pipelineTestRun, args.node)
    } catch (e) {
      this.error(e.body.message) // This currently shows a  ›   Error: Not found.
    }
  }
}
