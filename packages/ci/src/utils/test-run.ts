import color from '@heroku-cli/color'
import {get, RequestOptions} from 'https'

import {Command} from '@heroku-cli/command'

import * as Heroku from '@heroku-cli/schema'
import * as http from 'http'

function logStream(url: RequestOptions | string, fn: (res: http.IncomingMessage) => void) {
  return get(url, fn)
}

function stream(url: string) {
  return new Promise((resolve, reject) => {
    const request = logStream(url, output => {
      output.on('data', data => {
        if (data.toString() === Buffer.from('').toString()) {
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

function statusIcon({status}: Heroku.TestRun | Heroku.TestNode) {
  if (!status) { return color.yellow('-') }

  switch (status) {
    case 'pending':
    case 'creating':
    case 'building':
    case 'running':
    case 'debugging':
      return color.yellow('-')
    case 'errored':
      return color.red('!')
    case 'failed':
      return color.red('✗')
    case 'succeeded':
      return color.green('✓')
    case 'cancelled':
      return color.yellow('!')
    default:
      return color.yellow('?')

  }
}

function printLine(testRun: Heroku.TestRun) {
  return `${statusIcon(testRun)} #${testRun.number} ${testRun.commit_branch}:${testRun.commit_sha!.slice(0, 7)} ${testRun.status}`
}

function printLineTestNode(testNode: Heroku.TestNode) {
  return `${statusIcon(testNode)} #${testNode.index} ${testNode.status}`
}

async function renderNodeOutput(command: Command, testRun: Heroku.TestRun, testNode: Heroku.TestNode) {
  await stream(testNode.setup_stream_url!)
  await stream(testNode.output_stream_url!)

  command.log()
  command.log(printLine(testRun))
}

const BUILDING = 'building'
const RUNNING = 'running'
const ERRORED = 'errored'
const FAILED = 'failed'
const SUCCEEDED = 'succeeded'
const CANCELLED = 'cancelled'

const TERMINAL_STATES = [SUCCEEDED, FAILED, ERRORED, CANCELLED]
const RUNNING_STATES = [RUNNING].concat(TERMINAL_STATES)
const BUILDING_STATES = [BUILDING, RUNNING].concat(TERMINAL_STATES)

async function waitForStates(states: any, testRun: Heroku.TestRun, command: Command) {
  let newTestRun

  while (!states.includes(testRun.status)) {
    let {body: bodyTestRun} = await command.heroku.get<Heroku.TestRun>(`/pipelines/${testRun.pipeline!.id}/test-runs/${testRun.number}`)
    newTestRun = bodyTestRun
  }
  return newTestRun
}

async function display(pipeline: Heroku.Pipeline, number: number, command: Command) {
  let {body: testRun} = await command.heroku.get<Heroku.TestRun | undefined>(`/pipelines/${pipeline.id}/test-runs/${number}`)
  if (testRun) {
    let {body: testNodes} = await command.heroku.get<Heroku.TestNode[]>(`/test-runs/${testRun.id}/test-nodes`)
    let firstTestNode = testNodes[0]

    if (testRun) { testRun = await waitForStates(BUILDING_STATES, testRun, command) }
    if (firstTestNode) { await stream(firstTestNode.setup_stream_url!) }

    if (testRun) { testRun = await waitForStates(RUNNING_STATES, testRun, command) }
    if (firstTestNode) { await stream(firstTestNode.output_stream_url!) }

    if (testRun) { testRun = await waitForStates(TERMINAL_STATES, testRun, command) }

    // At this point, we know that testRun has a finished status,
    // and we can check for exit_code from firstTestNode
    if (testRun) {
      let {body: newTestNodes} = await command.heroku.get<Heroku.TestNode[]>(`/test-runs/${testRun.id}/test-nodes`)
      firstTestNode = newTestNodes[0]

      command.log()
      command.log(printLine(testRun))
    }
    return firstTestNode
  }
}

export async function displayAndExit(pipeline: any, number: number, command: Command) {
  let testNode = await display(pipeline, number, command)

  testNode && testNode.exit_code ? process.exit(testNode.exit_code) : process.exit(1)
}

export async function displayTestRunInfo(command: Command, testRun: Heroku.TestRun, testNodes: Heroku.TestNode[], nodeArg: string | undefined) {
  let testNode: Heroku.TestNode

  if (nodeArg) {
    const nodeIndex = parseInt(nodeArg, 2)
    testNode = testNodes.length > 1 ? testNodes[nodeIndex] : testNodes[0]

    await renderNodeOutput(command, testRun, testNode)

    if (testNodes.length === 1) {
      command.log()
      command.warn('This pipeline doesn\'t have parallel test runs, but you specified a node')
      command.warn('See https://devcenter.heroku.com/articles/heroku-ci-parallel-test-runs for more info')
    }
    process.exit(testNode.exit_code!)
  } else {
    if (testNodes.length > 1) {
      command.log(printLine(testRun))
      command.log()

      testNodes.forEach(testNode => {
        command.log(printLineTestNode(testNode))
      })
    } else {
      testNode = testNodes[0]
      await renderNodeOutput(command, testRun, testNode)
      process.exit(testNode.exit_code!)
    }
  }
}
