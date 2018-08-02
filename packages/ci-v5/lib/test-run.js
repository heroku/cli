const api = require('./heroku-api')
const cli = require('heroku-cli-util')
const wait = require('co-wait')
const RenderTestRuns = require('./render-test-runs')
const TestRunStatesUtil = require('./test-run-states-util')

function * waitForStates (states, testRun, { heroku }) {
  while (!states.includes(testRun.status)) {
    testRun = yield api.testRun(heroku, testRun.pipeline.id, testRun.number)
    yield wait(1000)
  }
  return testRun
}

function stream (url) {
  return new Promise((resolve, reject) => {
    const request = api.logStream(url, (output) => {
      output.on('data', (data) => {
        if (data.toString() === new Buffer('\0').toString()) {
          request.abort()
          resolve()
        }
      })

      output.on('end', () => resolve())

      output.on('error', (e) => reject(e))

      output.pipe(process.stdout)
    })
  })
}

function * display (pipeline, number, { heroku }) {
  let testRun = yield api.testRun(heroku, pipeline.id, number)
  let testNodes = yield api.testNodes(heroku, testRun.id)
  let firstTestNode = testNodes[0]

  testRun = yield waitForStates(TestRunStatesUtil.BUILDING_STATES, testRun, { heroku })

  yield stream(firstTestNode.setup_stream_url)

  testRun = yield waitForStates(TestRunStatesUtil.RUNNING_STATES, testRun, { heroku })

  yield stream(firstTestNode.output_stream_url)

  testRun = yield waitForStates(TestRunStatesUtil.TERMINAL_STATES, testRun, { heroku })

  // At this point, we know that testRun has a finished status,
  // and we can check for exit_code from firstTestNode
  testNodes = yield api.testNodes(heroku, testRun.id)
  firstTestNode = testNodes[0]

  cli.log(/* newline 💃 */)
  cli.log(RenderTestRuns.printLine(testRun))

  return firstTestNode
}

function * renderNodeOutput(testRun, testNode) {
  yield stream(testNode.setup_stream_url)
  yield stream(testNode.output_stream_url)

  cli.log(/* newline 💃 */)
  cli.log(RenderTestRuns.printLine(testRun))
}

function hasParallelTestRuns (testNodes) {
  return testNodes.length > 1;
}

function * displayInfo (pipeline, testRunNumber, { heroku }, nodeIndex) {
  let testRun = yield api.testRun(heroku, pipeline.id, testRunNumber)
  let testNodes = yield api.testNodes(heroku, testRun.id)
  let testNode

  if (nodeIndex) {
    if (hasParallelTestRuns(testNodes)) {
      testNode = testNodes[nodeIndex]

      if (!testNode) {
        cli.error(`There isn't a test node ${nodeIndex} for test run ${testRunNumber}`)
      }
    } else {
      testNode = testNodes[0]
    }

    yield renderNodeOutput(testRun, testNode)

    if (!hasParallelTestRuns(testNodes)) {
      cli.log(/* newline 💃 */)
      cli.warn(`This pipeline doesn't have parallel test runs, but you specified a node`)
      cli.warn(`See https://devcenter.heroku.com/articles/heroku-ci-parallel-test-runs for more info`)
    }
    process.exit(testNode.exit_code)
  } else {
    if (hasParallelTestRuns(testNodes)) {
      cli.log(RenderTestRuns.printLine(testRun))
      cli.log(/* newline 💃 */)
      testNodes.forEach((testNode) => {
        cli.log(RenderTestRuns.printLineTestNode(testNode))
      })
    } else {
      testNode = testNodes[0]
      yield renderNodeOutput(testRun, testNode);
      process.exit(testNode.exit_code)
    }
  }
}

function * displayAndExit (pipeline, number, { heroku }) {
  let testNode = yield display(pipeline, number, { heroku })
  process.exit(testNode.exit_code)
}

module.exports = {
  display,
  displayInfo,
  displayAndExit,
  waitForStates
}
