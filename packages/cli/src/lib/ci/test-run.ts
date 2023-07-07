import color from '@heroku-cli/color'
import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import * as http from 'http'
import {get, RequestOptions} from 'https'
import {Socket} from 'phoenix'
import {inspect} from 'util'
import {v4 as uuid} from 'uuid'
import WebSocket = require('ws')

const debug = require('debug')('ci')
const ansiEscapes = require('ansi-escapes')

const HEROKU_CI_WEBSOCKET_URL = process.env.HEROKU_CI_WEBSOCKET_URL || 'wss://particleboard.heroku.com/socket'

function logStream(url: RequestOptions | string, fn: (res: http.IncomingMessage) => void) {
  return get(url, fn)
}

function stream(url: string) {
  return new Promise<void>((resolve, reject) => {
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
  if (!status) {
    return color.yellow('-')
  }

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

const BUILDING = 'building'
const RUNNING = 'running'
const ERRORED = 'errored'
const FAILED = 'failed'
const SUCCEEDED = 'succeeded'
const CANCELLED = 'cancelled'

const TERMINAL_STATES = [SUCCEEDED, FAILED, ERRORED, CANCELLED]
const RUNNING_STATES = [RUNNING].concat(TERMINAL_STATES)
const BUILDING_STATES = [BUILDING, RUNNING].concat(TERMINAL_STATES)

function printLine(testRun: Heroku.TestRun) {
  return `${statusIcon(testRun)} #${testRun.number} ${testRun.commit_branch}:${testRun.commit_sha!.slice(0, 7)} ${testRun.status}`
}

function printLineTestNode(testNode: Heroku.TestNode) {
  return `${statusIcon(testNode)} #${testNode.index} ${testNode.status}`
}

function processExitCode(command: Command, testNode: Heroku.TestNode) {
  if (testNode.exit_code && testNode.exit_code !== 0) {
    command.exit(testNode.exit_code)
  }
}

function handleTestRunEvent(newTestRun: Heroku.TestRun, testRuns: Heroku.TestRun[]) {
  const previousTestRun = testRuns.find(({id}) => id === newTestRun.id)

  if (previousTestRun) {
    const previousTestRunIndex = testRuns.indexOf(previousTestRun)
    testRuns.splice(previousTestRunIndex, 1)
  }

  testRuns.push(newTestRun)
  return testRuns
}

function sort(testRuns: Heroku.TestRun[]) {
  return testRuns.sort((a: Heroku.TestRun, b: Heroku.TestRun) => a.number! < b.number! ? 1 : -1)
}

function draw(testRuns: Heroku.TestRun[], watchOption = false, jsonOption = false, count = 15) {
  const latestTestRuns = sort(testRuns).slice(0, count)

  if (jsonOption) {
    ux.styledJSON(latestTestRuns)
    return
  }

  if (watchOption) {
    process.stdout.write(ansiEscapes.eraseDown)
  }

  const data: any = []

  latestTestRuns.forEach(testRun => {
    data.push(
      {
        iconStatus: `${statusIcon(testRun)}`,
        number: testRun.number,
        branch: testRun.commit_branch,
        sha: testRun.commit_sha!.slice(0, 7),
        status: testRun.status,
      },
    )
  })

  ux.table(
    data,
    {
      iconStatus: {
        minWidth: 1, header: '', // header '' is to make sure that width is 1 character
      },
      number: {
        header: '', // header '' is to make sure that width is 1 character
      },
      branch: {},
      sha: {},
      status: {},
    },
    {printHeader: undefined})

  if (watchOption) {
    process.stdout.write(ansiEscapes.cursorUp(latestTestRuns.length))
  }
}

export async function renderList(command: Command, testRuns: Heroku.TestRun[], pipeline: Heroku.Pipeline, watchOption: boolean, jsonOption: boolean) {
  const watchable = (Boolean(watchOption && !jsonOption))

  if (!jsonOption) {
    const header = `${watchOption ? 'Watching' : 'Showing'} latest test runs for the ${pipeline.name} pipeline`
    ux.styledHeader(header)
  }

  draw(testRuns, watchOption, jsonOption)

  if (!watchable) {
    return
  }

  const socket = new Socket(HEROKU_CI_WEBSOCKET_URL, {
    transport: WebSocket,
    params: {
      token: command.heroku.auth,
      tab_id: `heroku-cli-${uuid()}`,
    },
    logger: (kind: any, msg: any, data: any) => debug(`${kind}: ${msg}\n${inspect(data)}`),
  })
  socket.connect()

  const channel = socket.channel(`events:pipelines/${pipeline.id}/test-runs`, {})

  channel.on('create', ({data}: any) => {
    testRuns = handleTestRunEvent(data, testRuns)
    draw(testRuns, watchOption)
  })

  channel.on('update', ({data}: any) => {
    testRuns = handleTestRunEvent(data, testRuns)
    draw(testRuns, watchOption)
  })
  // eslint-disable-next-line unicorn/require-array-join-separator
  channel.join()
}

async function renderNodeOutput(command: Command, testRun: Heroku.TestRun, testNode: Heroku.TestNode) {
  if (!testNode) {
    command.error(`Test run ${testRun.number} was ${testRun.status}. No Heroku CI runs found for this pipeline.`)
  }

  await stream(testNode.setup_stream_url!)
  await stream(testNode.output_stream_url!)

  command.log()
  command.log(printLine(testRun))
}

async function waitForStates(states: string[], testRun: Heroku.TestRun, command: Command) {
  let newTestRun = testRun

  while (!states.includes(newTestRun.status!.toString())) {
    const {body: bodyTestRun} = await command.heroku.get<Heroku.TestRun>(`/pipelines/${testRun.pipeline!.id}/test-runs/${testRun.number}`)
    newTestRun = bodyTestRun
  }

  return newTestRun
}

async function display(pipeline: Heroku.Pipeline, number: number, command: Command) {
  let {body: testRun} = await command.heroku.get<Heroku.TestRun | undefined>(`/pipelines/${pipeline.id}/test-runs/${number}`)
  if (testRun) {
    ux.action.start('Waiting for build to start')
    testRun = await waitForStates(BUILDING_STATES, testRun, command)
    ux.action.stop()

    const {body: testNodes} = await command.heroku.get<Heroku.TestNode[]>(`/test-runs/${testRun.id}/test-nodes`)
    let firstTestNode = testNodes[0]

    if (firstTestNode) {
      await stream(firstTestNode.setup_stream_url!)
    }

    if (testRun) {
      testRun = await waitForStates(RUNNING_STATES, testRun, command)
    }

    if (firstTestNode) {
      await stream(firstTestNode.output_stream_url!)
    }

    if (testRun) {
      testRun = await waitForStates(TERMINAL_STATES, testRun, command)
    }

    // At this point, we know that testRun has a finished status,
    // and we can check for exit_code from firstTestNode
    if (testRun) {
      const {body: newTestNodes} = await command.heroku.get<Heroku.TestNode[]>(`/test-runs/${testRun.id}/test-nodes`)
      firstTestNode = newTestNodes[0]

      command.log()
      command.log(printLine(testRun))
    }

    return firstTestNode
  }
}

export async function displayAndExit(pipeline: Heroku.Pipeline, number: number, command: Command) {
  const testNode = await display(pipeline, number, command)

  testNode ? processExitCode(command, testNode) : command.exit(1)
}

export async function displayTestRunInfo(command: Command, testRun: Heroku.TestRun, testNodes: Heroku.TestNode[], nodeArg: string | undefined) {
  let testNode: Heroku.TestNode

  if (nodeArg) {
    const nodeIndex = Number.parseInt(nodeArg, 2)
    testNode = testNodes.length > 1 ? testNodes[nodeIndex] : testNodes[0]

    await renderNodeOutput(command, testRun, testNode)

    if (testNodes.length === 1) {
      command.log()
      command.warn('This pipeline doesn\'t have parallel test runs, but you specified a node')
      command.warn('See https://devcenter.heroku.com/articles/heroku-ci-parallel-test-runs for more info')
    }

    processExitCode(command, testNode)
  } else if (testNodes.length > 1) {
    command.log(printLine(testRun))
    command.log()

    testNodes.forEach(testNode => {
      command.log(printLineTestNode(testNode))
    })
  } else {
    testNode = testNodes[0]
    await renderNodeOutput(command, testRun, testNode)
    processExitCode(command, testNode)
  }
}
