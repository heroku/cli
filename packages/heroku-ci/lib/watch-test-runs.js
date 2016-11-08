const cli = require('heroku-cli-util')
const log = require('single-line-log').stdout
const io = require('socket.io-client')
const api = require('./heroku-api')
const TestRun = require('./test-run')

const SIMI = 'https://simi-production.herokuapp.com'
const { PENDING, CREATING, BUILDING, RUNNING, ERRORED, FAILED, SUCCEEDED } = TestRun.STATES

const STATUS_ICONS = {
  [PENDING]: '⋯',
  [CREATING]: '⋯',
  [BUILDING]: '⋯',
  [RUNNING]: '⋯',
  [ERRORED]: '!',
  [FAILED]: '𐄂',
  [SUCCEEDED]: '✓'
}

const STATUS_COLORS = {
  [PENDING]: 'yellow',
  [CREATING]: 'yellow',
  [BUILDING]: 'yellow',
  [RUNNING]: 'yellow',
  [ERRORED]: 'red',
  [FAILED]: 'red',
  [SUCCEEDED]: 'green'
}

function isRunningOrRecent (testRun) {
  return TestRun.isNotTerminal(testRun) || TestRun.isRecent(testRun)
}

function* getRunningTests (heroku, pipelineID) {
  return (yield api.testRuns(heroku, pipelineID)).filter(isRunningOrRecent)
}

function statusIcon ({ status }) {
  return cli.color[STATUS_COLORS[status]](STATUS_ICONS[status])
}

function printLine (testRun) {
  return `${statusIcon(testRun)} #${testRun.number} ${testRun.commit_branch}:${testRun.commit_sha.slice(0, 6)} ${testRun.status}`
}

function handleTestRunEvent (newTestRun, testRuns) {
  const previousTestRun = testRuns.find(({ id }) => id === newTestRun.id)
  if (previousTestRun) {
    const previousTestRunIndex = testRuns.indexOf(previousTestRun)
    testRuns.splice(previousTestRunIndex, 1)
  }

  testRuns.push(newTestRun)

  return testRuns
}

function render (testRuns) {
  const sorted = testRuns.sort((a, b) => a.number < b.number ? 1 : -1)
  log(sorted.map(printLine).join('\n'))
}

function* watch (pipeline, { heroku }) {
  cli.styledHeader(`Watching test runs for the ${pipeline.name} pipeline`)

  let testRuns = yield getRunningTests(heroku, pipeline.id)

  render(testRuns)

  const socket = io(SIMI, { transports: ['websocket'], upgrade: false })

  socket.on('connect', () => {
    socket.emit('joinRoom', {
      room: `pipelines/${pipeline.id}/test-runs`,
      token: heroku.options.token
    })
  })

  socket.on('create', ({ resource, data }) => {
    if (resource === 'test-run') {
      testRuns = handleTestRunEvent(data, testRuns)
      render(testRuns)
    }
  })

  socket.on('update', ({ resource, data }) => {
    if (resource === 'test-run') {
      testRuns = handleTestRunEvent(data, testRuns)
      render(testRuns)
    }
  })
}

module.exports = {
  watch
}
