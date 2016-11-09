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

function statusIcon ({ status }) {
  return cli.color[STATUS_COLORS[status]](STATUS_ICONS[status])
}

function printLine (testRun) {
  return `${statusIcon(testRun)} #${testRun.number} ${testRun.commit_branch}:${testRun.commit_sha.slice(0, 6)} ${testRun.status}`
}

function limit (testRuns, count) {
  return testRuns.slice(0, count)
}

function sort (testRuns) {
  return testRuns.sort((a, b) => a.number < b.number ? 1 : -1)
}

function redraw (testRuns, count = 15) {
  const arranged = limit(sort(testRuns), count)
  return log(arranged.map(printLine).join('\n'))
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

function* render (pipeline, { heroku, watch }) {
  cli.styledHeader(
    `${watch ? 'Watching' : 'Showing'} latest test runs for the ${pipeline.name} pipeline`
  )

  let testRuns = yield api.testRuns(heroku, pipeline.id)

  redraw(testRuns)

  if (!watch) {
    return
  }

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
      redraw(testRuns)
    }
  })

  socket.on('update', ({ resource, data }) => {
    if (resource === 'test-run') {
      testRuns = handleTestRunEvent(data, testRuns)
      redraw(testRuns)
    }
  })
}

module.exports = {
  render
}
