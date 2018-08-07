import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'

import {Command, flags} from '@heroku-cli/command'

import {getPipeline} from '../../lib/utils/pipelines'

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

const STATUS_ICONS = {
  pending: '⋯',
  creating: '⋯',
  building: '⋯',
  running: '⋯',
  debugging: '⋯',
  errored: '!',
  failed: '✗',
  succeeded: '✓',
  cancelled: '!'
}

const STATUS_COLORS = {
  pending: 'yellow',
  creating: 'yellow',
  building: 'yellow',
  running: 'yellow',
  debugging: 'yellow',
  errored: 'red',
  failed: 'red',
  succeeded: 'green',
  cancelled: 'yellow',
  undefined: 'yellow'
}

function statusIcon({status}: Heroku.TestRun | Heroku.TestNode) {
  return color[STATUS_COLORS[status]](STATUS_ICONS[status!] || '-')

  // return color[STATUS_COLORS[status!]] || 'yellow'](STATUS_ICONS[status!] || '-')
}

function printLine(testRun: Heroku.TestRun) {
  return `${statusIcon(testRun)} #${testRun.number} ${testRun.commit_branch}:${testRun.commit_sha!.slice(0, 7)} ${testRun.status}`
}

function printLineTestNode(testNode: Heroku.TestNode) {
  return `${statusIcon(testNode)} #${testNode.index} ${testNode.status}`
}

async function renderNodeOutput(command: Command, testRun: Heroku.TestRun, testNode: Heroku.TestNode) {
  await stream(testNode.setup_stream_url)
  await stream(testNode.output_stream_url)

  command.log()
  command.log(printLine(testRun))
}

async function displayTestRunInfo(command: Command, testRun: Heroku.TestRun, testNodes: Heroku.TestNode[], nodeIndex: number) {
  let testNode: Heroku.TestNode

  if (nodeIndex) {
    testNode = testNodes.length > 1 ? testNodes[nodeIndex] : testNodes[0]

    await renderNodeOutput(command, testRun, testNode)

    if (testNodes.length === 1) {
      command.log()
      command.warn('This pipeline doesn\'t have parallel test runs, but you specified a node')
      command.warn('See https://devcenter.heroku.com/articles/heroku-ci-parallel-test-runs for more info')
    }
    process.exit(testNode.exit_code!)
  } else {
    if (testRun.hasParallelTestRuns()) {
      command.log(printLine(testRun))
      command.log()

      testNodes.forEach(testNode => {
        command.log(printLineTestNode(testNode))
      })
    } else {
      testNode = testRun.testNodes[0]
      await renderNodeOutput(command, testRun, testNode)
      process.exit(testNode.exit_code!)
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
      const {body: testRun} = await this.heroku.get<Heroku.TestRun>(`/pipelines/${pipeline.id}/test-runs/${args['test-run']}`, {headers})
      const {body: testNodes} = await this.heroku.get<Heroku.TestNode[]>(`/test-runs/${testRun.id}/test-nodes`, {headers})

      await displayTestRunInfo(this, testRun, testNodes, args.node)
    } catch (e) {
      this.error(e.body.message) // This currently shows a  ›   Error: Not found.
    }
  }
}
