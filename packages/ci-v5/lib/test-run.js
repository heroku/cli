const api = require('./heroku-api')
const wait = require('co-wait')

async function waitForStates(states, testRun, { heroku }) {
  while (!states.includes(testRun.status)) {
    testRun = await api.testRun(heroku, testRun.pipeline.id, testRun.number)
    await wait(1000)
  }
  return testRun
}

module.exports = {
  waitForStates
}
