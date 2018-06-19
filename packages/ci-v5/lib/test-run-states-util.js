const TestRunStates = require('./test-run-states')

const { BUILDING, RUNNING, ERRORED, FAILED, SUCCEEDED, CANCELLED } = TestRunStates

const TERMINAL_STATES = [SUCCEEDED, FAILED, ERRORED, CANCELLED]
const RUNNING_STATES = [RUNNING].concat(TERMINAL_STATES)
const BUILDING_STATES = [BUILDING, RUNNING].concat(TERMINAL_STATES)

function isTerminal (testRun) {
  return TERMINAL_STATES.includes(testRun.status)
}

function isNotTerminal (testRun) {
  return !isTerminal(testRun)
}

module.exports = {
  isTerminal,
  isNotTerminal,
  TERMINAL_STATES,
  RUNNING_STATES,
  BUILDING_STATES
}
