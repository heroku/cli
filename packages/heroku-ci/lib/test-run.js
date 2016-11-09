const api = require('./heroku-api')
const cli = require('heroku-cli-util')
const wait = require('co-wait')
const TestRunStates = require('./test-run-states')
const RenderTestRuns = require('./render-test-runs')

const { BUILDING, RUNNING, ERRORED, FAILED, SUCCEEDED } = TestRunStates

const TERMINAL_STATES = [SUCCEEDED, FAILED, ERRORED]
const RUNNING_STATES = [RUNNING].concat(TERMINAL_STATES)
const BUILDING_STATES = [BUILDING, RUNNING].concat(TERMINAL_STATES)

function isTerminal (testRun) {
  return TERMINAL_STATES.includes(testRun.status)
}

function isNotTerminal (testRun) {
  return !isTerminal(testRun)
}

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

  testRun = yield waitForStates(BUILDING_STATES, testRun, { heroku })

  yield stream(testRun.setup_stream_url)

  testRun = yield waitForStates(RUNNING_STATES, testRun, { heroku })

  yield stream(testRun.output_stream_url)

  testRun = yield waitForStates(TERMINAL_STATES, testRun, { heroku })

  cli.log(/* newline 💃 */)
  cli.log(RenderTestRuns.printLine(testRun))

  return testRun
}

function * displayAndExit (pipeline, number, { heroku }) {
  let testRun = yield display(pipeline, number, { heroku })
  process.exit(testRun.exit_code)
}

module.exports = {
  isTerminal,
  isNotTerminal,
  display,
  displayAndExit
}
